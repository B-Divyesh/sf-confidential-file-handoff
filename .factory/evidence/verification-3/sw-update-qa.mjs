import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = 4191;
const ORIGIN = `http://127.0.0.1:${PORT}`;

function start(cwd) {
  return spawn('npm', ['run', 'preview', '--', '--port', String(PORT)], {
    cwd,
    detached: true,
    stdio: 'ignore',
  });
}

function stop(child) {
  if (child?.pid) {
    try { process.kill(-child.pid, 'SIGTERM'); } catch {}
  }
}

async function waitForServer(expected) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(ORIGIN, { cache: 'no-store' });
      if (response.ok === expected) return;
    } catch {
      if (!expected) return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not reach expected state: ${expected}`);
}

let server = start('/tmp/cfh-sw-old-3bcec00');
await waitForServer(true);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', (error) => errors.push(error.message));

await page.goto(ORIGIN, { waitUntil: 'networkidle' });
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload({ waitUntil: 'networkidle' });
const oldState = await page.evaluate(async () => ({
  controlled: Boolean(navigator.serviceWorker.controller),
  caches: await caches.keys(),
  resources: performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.includes('/assets/')),
}));

stop(server);
await waitForServer(false);
server = start('/work/repo');
await waitForServer(true);

await page.evaluate(async () => {
  const registration = await navigator.serviceWorker.getRegistration();
  await registration.update();
});
await page.locator('#update-toast').waitFor({ state: 'visible', timeout: 15_000 });
const toast = await page.locator('#update-toast').innerText();
await page.locator('#reload-app').click();
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => performance.getEntriesByType('resource').some((entry) => entry.name.includes('/assets/main--qTiq1UH.js')));
const newState = await page.evaluate(async () => ({
  controlled: Boolean(navigator.serviceWorker.controller),
  caches: await caches.keys(),
  resources: performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => name.includes('/assets/')),
  firstScreen: document.querySelector('h1')?.textContent,
  hasDemoLink: Array.from(document.querySelectorAll('a')).some((link) => link.textContent?.includes('Try it with sample data')),
}));

console.log(JSON.stringify({ oldState, toast, newState, errors }, null, 2));
await browser.close();
stop(server);
