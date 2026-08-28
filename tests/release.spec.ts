import { readFile } from 'node:fs/promises';
import axe from 'axe-core';
import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js';
import { expect, test, type Page } from '@playwright/test';

async function preparePacket(page: Page, names = ['scan.pdf']) {
  await page.locator('#files').setInputFiles(names.map((name, index) => ({ name, mimeType: 'text/plain', buffer: Buffer.from(`private file ${index + 1}`) })));
  await page.locator('#recipient').fill('Maya');
  await page.locator('#password').fill('correct horse battery staple');
  await page.locator('#password-saved').check();
  await page.locator('#prepare').click();
  await expect(page.locator('#kit')).toBeVisible();
}

test('duplicate names produce a decryptable packet and delayed acknowledgements persist', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#update-toast')).toBeHidden();
  await preparePacket(page, ['scan.pdf', 'scan.pdf']);

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const download = await downloadPromise;
  const archive = new Blob([await readFile(await download.path() as string)]);
  const reader = new ZipReader(new BlobReader(archive));
  const entries = await reader.getEntries();
  expect(entries.map((entry) => entry.filename)).toEqual(['scan.pdf', 'scan (2).pdf']);
  const extracted = await entries[1].getData!(new BlobWriter(), { password: 'correct horse battery staple' });
  expect(await extracted.text()).toBe('private file 2');
  await expect(entries[0].getData!(new BlobWriter(), { password: 'wrong password' })).rejects.toThrow();
  await reader.close();

  await page.reload();
  await expect(page.getByText('Maya', { exact: true })).toBeVisible();
  await page.getByLabel('Mark ZIP and sheet sent').evaluate((element: HTMLInputElement) => element.click());
  await expect(page.locator('.record-state')).toContainText('Sent');
  await page.getByLabel('Mark files opened').evaluate((element: HTMLInputElement) => element.click());
  await expect(page.locator('.record-state')).toContainText('Opened');
  await page.reload();
  await expect(page.locator('.record-state')).toContainText('Sent');
  await expect(page.locator('.record-state')).toContainText('Opened');
  expect(errors).toEqual([]);
});

test('print contains the recipient sheet instead of a blank page', async ({ page }) => {
  await page.goto('/');
  await preparePacket(page);
  const popupPromise = page.waitForEvent('popup');
  await page.locator('#print-sheet').click();
  const popup = await popupPromise;
  await expect(popup.locator('pre')).toContainText('SHARED FILE RECEIPT');
  await expect(popup.locator('pre')).toContainText('ZIP extractor');
  await popup.close();
});

test('blocked IndexedDB does not block the prepared downloads', async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', { configurable: true, value: { open: () => { throw new DOMException('blocked', 'SecurityError'); } } });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await preparePacket(page);
  await expect(page.locator('#status')).toContainText('both downloads are ready');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  expect((await downloadPromise).suggestedFilename()).toBe('shared-file-receipt.zip');
  expect(errors).toEqual([]);
  await context.close();
});

test('invalid or secret-bearing imports are rejected without poisoning the log', async ({ page }) => {
  await page.goto('/');
  const poisoned = JSON.stringify({ handoffs: [{ id: 'bad', recipient: 'Maya', createdAt: 'not-a-date', delivery: 'Email', passwordChannel: 'Text', password: 'do-not-store', fileName: 'secret.pdf' }] });
  await page.locator('#import-records').setInputFiles({ name: 'poison.json', mimeType: 'application/json', buffer: Buffer.from(poisoned) });
  await expect(page.locator('#status')).toContainText('No entries were imported');
  await page.reload();
  await expect(page.locator('#record-list')).toContainText('No file receipts logged yet');
  const rows = await page.evaluate(async () => new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open('confidential-file-handoff', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const all = request.result.transaction('handoffs').objectStore('handoffs').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }));
  expect(rows).toEqual([]);
});

test('legacy poisoned rows are removed or stripped before the log renders', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('confidential-file-handoff', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const transaction = request.result.transaction('handoffs', 'readwrite');
      const store = transaction.objectStore('handoffs');
      store.put({ id: 'safe', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text', password: 'legacy-secret', fileName: 'secret.pdf' });
      store.put({ id: 'broken', recipient: 'Broken', createdAt: 'not-a-date', delivery: 'Email', passwordChannel: 'Text' });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    };
  }));
  await page.reload();
  await expect(page.getByText('Maya', { exact: true })).toBeVisible();
  await expect(page.getByText('Broken', { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(async () => new Promise<unknown[]>((resolve, reject) => {
    const request = indexedDB.open('confidential-file-handoff', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const all = request.result.transaction('handoffs').objectStore('handoffs').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }))).toEqual([{ id: 'safe', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text' }]);
});

test('returned licenses are stripped and verified through the same-origin gateway', async ({ page }) => {
  let requestURL = '';
  await page.route('**/api/license/verify?**', async (route) => {
    requestURL = route.request().url();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  await page.goto('/?license=returned-test-token');
  await expect(page).toHaveURL('/');
  await expect(page.locator('#license-status')).toContainText('License no longer active');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:confidential-file-handoff'))).toBe('returned-test-token');
  expect(requestURL).toContain('/api/license/verify?license=returned-test-token');
  expect(new URL(requestURL).origin).toBe('http://127.0.0.1:4173');
  await expect(page.locator('#custom-note')).toBeDisabled();
});

test('@claim:demo-sandbox sample demo is ready in an isolated namespace and resets', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved.')).toBeVisible();
  await expect(page.locator('#file-label')).toHaveText('2 sample files selected');
  await expect(page.locator('#recipient')).toHaveValue('Maya');
  expect(await page.evaluate(() => localStorage.getItem('sb_license:confidential-file-handoff'))).toBeNull();
  await page.locator('#reset-demo').click();
  await expect(page.locator('#file-label')).toHaveText('2 sample files selected');
  await expect(page.locator('#record-list')).toContainText('No file receipts logged yet');
});

test('@regression:neutral-product-qa-copy uses shared file receipt wording on every public route', async ({ page }) => {
  const routes = ['/', '/demo', '/privacy/', '/terms/', '/offline.html', '/404.html'];
  for (const route of routes) {
    await page.goto(route);
    const text = await page.locator('body').innerText();
    expect(text).toMatch(/shared file receipt/i);
    expect(text).not.toMatch(/\b(confidential|sensitive|encrypted|password|security|threat)\b/i);
  }
  await page.goto('/demo');
  await page.locator('#prepare').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-sheet').click();
  const receipt = await readFile(await (await downloadPromise).path() as string, 'utf8');
  expect(receipt).toMatch(/SHARED FILE RECEIPT/);
  expect(receipt).not.toMatch(/\b(confidential|sensitive|encrypted|password|security|threat)\b/i);
});

test('@claim:encrypted-local-zip demo creates a decryptable AES ZIP without uploads', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#prepare').click();
  await expect(page.locator('#kit')).toBeVisible();
  await page.locator('#download-zip').click();
  const download = await downloadPromise;
  const reader = new ZipReader(new BlobReader(new Blob([await readFile(await download.path() as string)])));
  const entries = await reader.getEntries();
  expect(entries).toHaveLength(2);
  await expect(entries[0].getData!(new BlobWriter(), { password: 'sample-password-2026' })).resolves.toBeInstanceOf(Blob);
  await reader.close();
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4173')).toBe(true);
});

test('@claim:offline-after-first-visit demo reloads and creates a packet offline', async ({ page, context }) => {
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.locator('#prepare').click();
  await expect(page.locator('#kit')).toBeVisible();
  await context.setOffline(false);
});

test('@claim:local-log-export demo exports only checklist fields', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#prepare').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export-records').click();
  const download = await downloadPromise;
  const contents = JSON.parse(await readFile(await download.path() as string, 'utf8')) as { handoffs: Array<Record<string, unknown>> };
  expect(Object.keys(contents.handoffs[0]).sort()).toEqual(['createdAt', 'delivery', 'id', 'passwordChannel', 'recipient']);
});

test('an unverified token stays locked during a network failure and temporary errors preserve a cached verdict', async ({ page }) => {
  await page.route('**/api/license/verify?**', async (route) => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'unavailable' }) }));
  await page.goto('/?license=not-a-real-license');
  await expect(page.locator('#custom-note')).toBeDisabled();
  await expect(page.locator('#license-status')).toContainText('Pro stays locked');
  expect(await page.evaluate(() => localStorage.getItem('sb_license_verdict:confidential-file-handoff'))).toBeNull();
  await page.evaluate(() => localStorage.setItem('sb_license_verdict:confidential-file-handoff', JSON.stringify({ checkedAt: Date.now() - 90_000_000, valid: true, license: 'not-a-real-license' })));
  await page.reload();
  await expect(page.locator('#custom-note')).toBeEnabled();
  await expect(page.locator('#license-status')).toContainText('last verified check');
  const cache = await page.evaluate(() => localStorage.getItem('sb_license_verdict:confidential-file-handoff'));
  expect(JSON.parse(cache || '{}').valid).toBe(true);
});

test('@claim:pro-note-entitlement first-use tokens stay locked until verified and cannot enter a sheet', async ({ page }) => {
  let releaseVerification: (() => void) | undefined;
  await page.route('**/api/license/verify?**', async (route) => {
    await new Promise<void>((resolve) => { releaseVerification = () => resolve(); });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  });
  await page.goto('/?license=never-verified-qa-token', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#license-status')).toContainText('Checking your license');
  await expect(page.locator('#custom-note')).toBeDisabled();
  await page.locator('#custom-note').evaluate((element: HTMLTextAreaElement) => { element.value = 'This must never be exported.'; });
  await preparePacket(page);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-sheet').click();
  expect(await readFile(await (await downloadPromise).path() as string, 'utf8')).not.toContain('This must never be exported.');
  releaseVerification?.();
  await expect(page.locator('#license-status')).toContainText('License no longer active');
  await expect(page.locator('#custom-note')).toBeDisabled();
});

test('@claim:demo-exit-discard leaving the demo clears its checklist before real mode', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#prepare').click();
  await expect(page.locator('#record-list')).toContainText('Maya');
  await Promise.all([page.waitForURL('/'), page.locator('#start-real').click()]);
  await page.goto('/demo');
  await expect(page.locator('#record-list')).toContainText('No file receipts logged yet');
});

test('@claim:checklist-secrets-excluded only the checklist fields are retained and the password stays out of the sheet', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#prepare').click();
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#download-sheet').click();
  const sheet = await readFile(await (await downloadPromise).path() as string, 'utf8');
  expect(sheet).not.toContain('sample-password-2026');
  const stored = await page.evaluate(async () => new Promise<Record<string, unknown>[]>((resolve, reject) => {
    const request = indexedDB.open('demo:confidential-file-handoff', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const all = request.result.transaction('handoffs').objectStore('handoffs').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }));
  expect(Object.keys(stored[0]).sort()).toEqual(['createdAt', 'delivery', 'id', 'passwordChannel', 'recipient']);
});

test('invalid submit focuses the first associated field and announces its correction', async ({ page }) => {
  await page.goto('/');
  await page.locator('#files').setInputFiles({ name: 'sample.txt', mimeType: 'text/plain', buffer: Buffer.from('sample') });
  await page.locator('#prepare').click();
  await expect(page.locator('#status')).toContainText('Fix the marked fields');
  await expect(page.locator('#recipient')).toBeFocused();
  await expect(page.locator('#recipient')).toHaveAttribute('aria-describedby', 'recipient-error');
  await expect(page.locator('#password-saved')).toHaveAttribute('aria-describedby', 'saved-error');
});

test('mobile keyboard focus and touch targets are visible and accessible in both themes', async ({ browser }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme });
    const page = await context.newPage();
    await page.goto('/');
    await page.locator('#files').focus();
    const outline = await page.locator('.file-picker').evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe('none');
    const tooSmall = await page.locator('.site-header a:visible, footer a:visible, #recipient, #license-input').evaluateAll((elements) => elements
      .map((element) => ({ label: element.textContent || element.getAttribute('id'), width: element.getBoundingClientRect().width, height: element.getBoundingClientRect().height }))
      .filter(({ width, height }) => width < 44 || height < 44));
    expect(tooSmall).toEqual([]);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () => (await window.axe.run(document)).violations);
    expect(violations).toEqual([]);
    await context.close();
  }
});

test('installed app serves the real privacy page offline and precaches hashed assets', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const worker = await (await page.request.get('/sw.js')).text();
  expect(worker).toMatch(/confidential-handoff-[a-f0-9]{16}/);
  expect(worker).toMatch(/\/assets\/[A-Za-z0-9_-]+\.js/);
  await context.setOffline(true);
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  await context.setOffline(false);
});

declare global {
  interface Window { axe: typeof axe }
}
