import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import axe from 'axe-core';
import { BlobReader, BlobWriter, ZipReader } from '@zip.js/zip.js';

const BASE = 'https://confidential-file-handoff.sociobot.in';
const results = {};
const browser = await chromium.launch({ headless: true });

async function downloadBytes(download) {
  return readFile(await download.path());
}

async function inspectZip(bytes, password) {
  const reader = new ZipReader(new BlobReader(new Blob([bytes])));
  const entries = await reader.getEntries();
  const contents = [];
  for (const entry of entries) {
    const extracted = await entry.getData(new BlobWriter(), { password });
    contents.push({ name: entry.filename, bytes: extracted.size, encrypted: entry.encrypted, compressionMethod: entry.compressionMethod });
  }
  let wrongPasswordRejected = false;
  try {
    await entries[0].getData(new BlobWriter(), { password: 'wrong-password-for-qa' });
  } catch {
    wrongPasswordRejected = true;
  }
  await reader.close();
  return { entries: contents, wrongPasswordRejected };
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push({ method: request.method(), url: request.url(), type: request.resourceType() }));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  const response = await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  const rootHeaders = await response.allHeaders();
  const initial = {
    title: await page.title(),
    h1: await page.locator('h1').allTextContents(),
    banner: await page.locator('#demo-banner').innerText(),
    files: await page.locator('#file-label').innerText(),
    recipient: await page.locator('#recipient').inputValue(),
    realLicenseVisible: await page.evaluate(() => localStorage.getItem('sb_license:confidential-file-handoff')),
  };
  await page.locator('#prepare').click();
  await page.locator('#kit').waitFor({ state: 'visible' });
  const zipEvent = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const zipBytes = await downloadBytes(await zipEvent);
  const zip = await inspectZip(zipBytes, 'sample-password-2026');
  const sheetEvent = page.waitForEvent('download');
  await page.locator('#download-sheet').click();
  const sheet = (await downloadBytes(await sheetEvent)).toString('utf8');
  const popupEvent = page.waitForEvent('popup');
  await page.locator('#print-sheet').click();
  const popup = await popupEvent;
  const printText = await popup.locator('pre').innerText();
  await popup.close();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('Mark ZIP and sheet sent').check();
  await page.getByLabel('Mark files opened').check();
  await page.reload({ waitUntil: 'networkidle' });
  const persistedState = await page.locator('.record-state').innerText();
  const exportEvent = page.waitForEvent('download');
  await page.locator('#export-records').click();
  const exported = JSON.parse((await downloadBytes(await exportEvent)).toString('utf8'));
  const dbNamesBeforeExit = await page.evaluate(async () => (await indexedDB.databases()).map((db) => db.name));
  await page.getByRole('link', { name: 'Start for real' }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  const demoRowsAfterExitAndReturn = await page.locator('.record-list > li').count();
  await page.screenshot({ path: '.factory/evidence/verification-3/live-demo-complete.png', fullPage: true });
  results.demoAndCore = {
    initial,
    rootHeaders,
    zip,
    sheetChecks: {
      recipient: sheet.includes('Hello Maya'),
      delivery: sheet.includes('Email attachment'),
      passwordRoute: sheet.includes('Text message'),
      omitsPassword: !sheet.includes('sample-password-2026'),
      omitsFileNames: !sheet.includes('2026-tax-summary.txt') && !sheet.includes('identity-checklist.txt'),
      compatibility: sheet.includes('7-Zip') && sheet.includes('Keka') && sheet.includes('PeaZip'),
      printContainsSheet: printText.includes('CONFIDENTIAL FILE HANDOFF') && printText.includes('Hello Maya') && printText.includes('AES-256 ZIP-compatible extractor'),
    },
    persistedState,
    exportKeys: Object.keys(exported.handoffs[0]).sort(),
    dbNamesBeforeExit,
    demoRowsAfterExitAndReturn,
    requests,
    allCoreRequestsSameOrigin: requests.every((request) => new URL(request.url).origin === BASE),
    errors,
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.locator('#prepare').click();
  const emptyErrors = {
    file: await page.locator('#file-error').innerText(),
    recipient: await page.locator('#recipient-error').innerText(),
    password: await page.locator('#password-error').innerText(),
    saved: await page.locator('#saved-error').innerText(),
    focused: await page.evaluate(() => document.activeElement?.id),
  };
  const fiveMiB = Buffer.alloc(5 * 1024 * 1024, 65);
  await page.locator('#files').setInputFiles([
    { name: 'scan.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(0) },
    { name: 'scan.pdf', mimeType: 'application/pdf', buffer: fiveMiB },
  ]);
  await page.locator('#recipient').fill('R'.repeat(80));
  await page.locator('#password').fill('123456789012');
  await page.locator('#delivery').selectOption({ label: 'Hand-delivered USB drive' });
  await page.locator('#password-channel').selectOption({ label: 'A phone call' });
  await page.locator('#password-saved').check();
  await page.locator('#prepare').click();
  await page.locator('#kit').waitFor({ state: 'visible' });
  const zipEvent = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const zipBytes = await downloadBytes(await zipEvent);
  const zip = await inspectZip(zipBytes, '123456789012');
  const sheetEvent = page.waitForEvent('download');
  await page.locator('#download-sheet').click();
  const sheet = (await downloadBytes(await sheetEvent)).toString('utf8');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByLabel('Mark ZIP and sheet sent').check();
  await page.getByLabel('Mark files opened').check();
  await page.locator('.record-state').filter({ hasText: 'Opened' }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  const rows = await page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open('confidential-file-handoff', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const all = request.result.transaction('handoffs').objectStore('handoffs').getAll();
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    };
  }));
  const poison = JSON.stringify({ handoffs: [{ id: 'bad', recipient: 'Maya', createdAt: 'not-a-date', delivery: 'Email', passwordChannel: 'Text', password: 'secret', fileName: 'secret.pdf' }] });
  await page.locator('#import-records').setInputFiles({ name: 'poison.json', mimeType: 'application/json', buffer: Buffer.from(poison) });
  const poisonStatus = await page.locator('#status').innerText();
  const rowCountAfterPoison = await page.locator('.record-list > li').count();
  results.boundariesAndRecovery = {
    emptyErrors,
    zip,
    sheetChecks: {
      route: sheet.includes('Hand-delivered USB drive'),
      passwordRoute: sheet.includes('A phone call'),
      omitsPassword: !sheet.includes('123456789012'),
      omitsFileName: !sheet.includes('scan.pdf'),
    },
    persistedState: await page.locator('.record-state').innerText(),
    storedKeys: rows.map((row) => Object.keys(row).sort()),
    poisonStatus,
    rowCountAfterPoison,
    errors,
  };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await context.addInitScript(() => {
    localStorage.setItem('sb_license:confidential-file-handoff', 'qa-invalid-held-license');
    localStorage.removeItem('sb_license_verdict:confidential-file-handoff');
  });
  const page = await context.newPage();
  let heldRoute;
  await page.route('**/api/license/verify?**', async (route) => { heldRoute = route; });
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  const beforeVerdict = {
    url: page.url(),
    status: await page.locator('#license-status').innerText(),
    noteEnabled: await page.locator('#custom-note').isEnabled(),
    storedToken: await page.evaluate(() => localStorage.getItem('sb_license:confidential-file-handoff')),
    cachedVerdict: await page.evaluate(() => localStorage.getItem('sb_license_verdict:confidential-file-handoff')),
  };
  if (beforeVerdict.noteEnabled) {
    await page.locator('#custom-note').fill('PAID NOTE EXPOSED BEFORE VERIFICATION');
    await page.locator('#files').setInputFiles({ name: 'proof.txt', mimeType: 'text/plain', buffer: Buffer.from('proof') });
    await page.locator('#recipient').fill('Maya');
    await page.locator('#password').fill('correct horse battery staple');
    await page.locator('#password-saved').check();
    await page.locator('#prepare').click();
    await page.locator('#kit').waitFor({ state: 'visible' });
  }
  let sheetContainsPaidNote = false;
  if (await page.locator('#kit').isVisible()) {
    const event = page.waitForEvent('download');
    await page.locator('#download-sheet').click();
    const sheet = (await downloadBytes(await event)).toString('utf8');
    sheetContainsPaidNote = sheet.includes('PAID NOTE EXPOSED BEFORE VERIFICATION');
  }
  if (heldRoute) await heldRoute.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }) });
  await page.waitForTimeout(100);
  results.licenseVerificationRace = {
    beforeVerdict,
    sheetContainsPaidNote,
    afterVerdict: {
      status: await page.locator('#license-status').innerText(),
      noteEnabled: await page.locator('#custom-note').isEnabled(),
      cachedVerdict: await page.evaluate(() => localStorage.getItem('sb_license_verdict:confidential-file-handoff')),
    },
  };
  await context.close();
}

for (const colorScheme of ['light', 'dark']) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const firstTab = await page.evaluate(() => ({ text: document.activeElement?.textContent?.trim(), id: document.activeElement?.id, className: document.activeElement?.className }));
  const skipBox = await page.locator('.skip-link').boundingBox();
  await page.keyboard.press('Enter');
  const afterSkip = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id, hash: location.hash }));
  await page.locator('#files').focus();
  const fileFocus = await page.locator('.file-picker').evaluate((element) => { const style = getComputedStyle(element); return { outline: style.outline, outlineColor: style.outlineColor }; });
  await page.evaluate(axe.source);
  const violations = await page.evaluate(async () => (await window.axe.run(document)).violations.map((item) => ({ id: item.id, impact: item.impact, nodes: item.nodes.length })));
  const seriousCritical = violations.filter((item) => item.impact === 'serious' || item.impact === 'critical');
  const tooSmall = await page.locator('a:visible, button:visible, input:not([type="checkbox"]):not([type="file"]):visible, select:visible, textarea:visible, .file-picker:visible, .checkline:visible').evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { label: (element.textContent || element.getAttribute('aria-label') || element.id).trim().replace(/\s+/g, ' '), width: Math.round(box.width), height: Math.round(box.height) };
  }).filter((item) => item.width < 44 || item.height < 44));
  const motion = await page.evaluate(() => {
    const hero = getComputedStyle(document.querySelector('.hero'));
    const button = getComputedStyle(document.querySelector('.button'));
    return { mediaMatches: matchMedia('(prefers-reduced-motion: reduce)').matches, scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior, heroAnimation: hero.animationName, heroTransform: hero.transform, buttonTransition: button.transitionDuration };
  });
  const layout = await page.evaluate(() => ({ innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, h1Count: document.querySelectorAll('h1').length, lang: document.documentElement.lang }));
  await page.screenshot({ path: `.factory/evidence/verification-3/live-mobile-${colorScheme}-fresh.png`, fullPage: true });
  results[`mobile-${colorScheme}`] = { firstTab, skipBox, afterSkip, fileFocus, violations, seriousCritical, tooSmall, motion, layout, errors };
  await context.close();
}

{
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${BASE}/demo`, { waitUntil: 'networkidle' });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload({ waitUntil: 'networkidle' });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker.controller));
  const registrations = await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).map((registration) => ({ scope: registration.scope, active: registration.active?.scriptURL, waiting: registration.waiting?.scriptURL, installing: registration.installing?.scriptURL })));
  const cachesBefore = await page.evaluate(() => caches.keys());
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#prepare').click();
  await page.locator('#kit').waitFor({ state: 'visible' });
  const event = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const offlineZip = await inspectZip(await downloadBytes(await event), 'sample-password-2026');
  await page.goto(`${BASE}/privacy/`, { waitUntil: 'domcontentloaded' });
  const privacyTitle = await page.locator('h1').innerText();
  await context.setOffline(false);
  results.offlinePwa = { controlled, registrations, cachesBefore, offlineZip, privacyTitle, errors };
  await context.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
