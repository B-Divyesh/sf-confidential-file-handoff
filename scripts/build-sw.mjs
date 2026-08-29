import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join, relative, resolve } from 'node:path';
import { env } from 'node:process';

const root = resolve('dist');
const buildId = env.GITHUB_SHA?.slice(0, 7) || execFileSync('git', ['rev-parse', '--short', 'HEAD']).toString().trim();

async function replaceBuildId(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return replaceBuildId(file);
    if (!entry.name.endsWith('.html')) return undefined;
    const html = await readFile(file, 'utf8');
    if (html.includes('__BUILD_ID__')) await writeFile(file, html.replaceAll('__BUILD_ID__', buildId));
    return undefined;
  }));
}

await replaceBuildId(root);

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesUnder(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}

const files = (await filesUnder(root)).filter((file) => !file.endsWith('/sw.js') && !file.endsWith('staticwebapp.config.json'));
const versionHash = createHash('sha256');
for (const file of files.sort()) versionHash.update(relative(root, file)).update(await readFile(file));
const version = versionHash.digest('hex').slice(0, 16);
const assets = files
  .map((file) => `/${relative(root, file).replaceAll('\\', '/')}`)
  .filter((path) => path.startsWith('/assets/') || path.startsWith('/icons/') || path === '/print-desk.webp');
const shell = ['/', '/index.html', '/demo', '/offline.html', '/privacy/', '/terms/', '/site.css', '/route-nav.js', '/manifest.webmanifest', ...assets];

const source = `const CACHE_PREFIX = 'confidential-handoff-';
const CACHE = 'confidential-handoff-${version}';
const SHELL = ${JSON.stringify(shell)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(async () => {
      const path = url.pathname;
      return (await caches.match(event.request))
        || (await caches.match(path))
        || (path === '/' ? await caches.match('/index.html') : undefined)
        || (await caches.match('/offline.html'));
    }));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
`;

await writeFile(join(root, 'sw.js'), source);
console.log(`Generated service worker confidential-handoff-${version} with ${shell.length} precached URLs.`);
