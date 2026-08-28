import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js';
import './style.css';
import { HandoffStore, makePassword, recipientSheet, type HandoffRecord } from './lib';

const SLUG = 'confidential-file-handoff';
const LICENSE_KEY = `sb_license:${SLUG}`;
const LICENSE_CACHE_KEY = `sb_license_verdict:${SLUG}`;
const store = new HandoffStore();
let activeRecord: HandoffRecord | undefined;
let proUnlocked = Boolean(localStorage.getItem(`sb_license:${SLUG}`));

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header"><a class="brand" href="/" aria-label="Confidential File Handoff home"><span class="brand-mark" aria-hidden="true">↗</span> Confidential<br>File Handoff</a><nav aria-label="Site"><a href="#how-it-works">How it works</a><a href="#records">Handoff log</a><a href="#privacy-note">Privacy</a></nav></header>
  <main id="main">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy"><p class="eyebrow">A simple procedure for sensitive files</p><h1 id="page-title">Make the file handoff easy to follow.</h1><p class="lede">Create an encrypted ZIP on this device, then give your recipient a plain-language sheet that says exactly where the password arrives.</p><a class="button button-primary" href="#builder">Prepare a handoff <span aria-hidden="true">↓</span></a><p class="microcopy">No upload. No account. Your files and password stay on this device.</p></div>
      <figure class="hero-art"><img src="/print-desk.webp" width="900" height="600" alt="" fetchpriority="high" decoding="async"><figcaption>Original generated print illustration. This app does not send your files anywhere.</figcaption></figure>
    </section>

    <section class="truth-strip" id="how-it-works" aria-label="What this tool does">
      <p><strong>1. Seal the files</strong><span>Choose files and a password.</span></p><p><strong>2. Separate the routes</strong><span>Send the ZIP and password by different channels.</span></p><p><strong>3. Check the handoff</strong><span>Record when they confirm opening it.</span></p>
    </section>

    <section class="builder" id="builder" aria-labelledby="builder-title">
      <div class="section-intro"><p class="eyebrow">The handoff builder</p><h2 id="builder-title">Prepare the packet</h2><p>Everything happens in your browser. The password is never stored or included in the ZIP handoff sheet.</p></div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <form id="handoff-form" novalidate>
        <fieldset class="step"><legend><span>01</span> Add the files</legend><p class="step-help">They are read only to create a password-protected ZIP. File names are not saved in the handoff log.</p><label class="file-picker" for="files"><span class="file-icon" aria-hidden="true">+</span><strong id="file-label">Choose files</strong><small>PDFs, photos, scans, or any files from this device</small></label><input id="files" name="files" type="file" multiple required aria-describedby="file-error"><p class="form-error" id="file-error"></p></fieldset>
        <fieldset class="step"><legend><span>02</span> Write the two routes</legend><div class="field-grid"><div><label for="recipient">Recipient’s first name</label><input id="recipient" name="recipient" autocomplete="name" maxlength="80" required><p class="form-error" id="recipient-error"></p></div><div><label for="delivery">Where will the ZIP go?</label><select id="delivery" name="delivery"><option>Email attachment</option><option>A link you share yourself</option><option>Hand-delivered USB drive</option><option>Another app or service</option></select></div><div><label for="password-channel">Where will the password go?</label><select id="password-channel" name="password-channel"><option>Text message</option><option>A phone call</option><option>In person</option><option>A second email address</option><option>Another separate channel</option></select></div></div><p class="separation-note"><span aria-hidden="true">↔</span> Send the ZIP and its password by different channels. This app cannot make that choice for you.</p><div class="pro-note"><label for="custom-note">Optional personal note <span class="pro-tag">Pro</span></label><textarea id="custom-note" maxlength="280" disabled aria-describedby="custom-note-help"></textarea><p id="custom-note-help" class="microcopy">Unlock Pro to add a short note to the recipient handoff sheet.</p></div></fieldset>
        <fieldset class="step"><legend><span>03</span> Set a password</legend><p class="step-help">Use a new password for this handoff. Save it in your password manager or write it down before you close this page.</p><div class="password-row"><div><label for="password">ZIP password</label><input id="password" name="password" type="text" autocapitalize="off" autocomplete="new-password" spellcheck="false" minlength="12" required aria-describedby="password-error"><p class="form-error" id="password-error"></p></div><button id="generate-password" class="button button-secondary" type="button">Make a password</button></div><label class="checkline"><input id="password-saved" type="checkbox" required><span>I have saved this password somewhere safe. It will not be saved by this app.</span></label><p class="form-error" id="saved-error"></p></fieldset>
        <button id="prepare" class="button button-primary button-large" type="submit">Create encrypted ZIP and handoff sheet <span aria-hidden="true">→</span></button>
      </form>
    </section>

    <section id="kit" class="handoff-kit" hidden aria-labelledby="kit-title" tabindex="-1"><div class="kit-stamp" aria-hidden="true">READY<br>TO HAND OFF</div><p class="eyebrow">Your packet is prepared</p><h2 id="kit-title">Send these two things separately.</h2><div class="kit-grid"><article><p class="kit-number">A</p><h3>Encrypted ZIP</h3><p>Send this file using your selected delivery route. It requires the password to open.</p><button class="button button-primary" id="download-zip" type="button">Download encrypted ZIP</button></article><article><p class="kit-number">B</p><h3>Recipient handoff sheet</h3><p>Send or print this with the ZIP. It tells <span id="kit-recipient">your recipient</span where to expect the password.</p><button class="button button-secondary" id="download-sheet" type="button">Download handoff sheet</button><button class="link-button" id="print-sheet" type="button">Print the sheet</button></article></div><div class="acknowledgement"><h3>Manual acknowledgement</h3><p>Keep only the facts you need—never the files, password, or file names.</p><label class="checkline"><input id="sent-check" type="checkbox"><span>I sent the encrypted ZIP and handoff sheet.</span></label><label class="checkline"><input id="ack-check" type="checkbox"><span>The recipient confirmed they opened the files.</span></label></div><button class="link-button" id="start-again" type="button">Prepare another handoff</button></section>

    <section class="records" id="records" aria-labelledby="records-title"><div class="section-intro"><p class="eyebrow">Local handoff log</p><h2 id="records-title">Acknowledge, then forget.</h2><p>This browser keeps a small checklist—recipient name, dates, and delivery routes only. No file names or passwords.</p></div><div class="record-actions"><button class="button button-secondary" id="export-records" type="button">Export handoff log</button><label class="button button-secondary import-button">Import log<input id="import-records" type="file" accept="application/json"></label></div><div id="record-list" aria-live="polite"></div></section>

    <section class="plain-truth" id="privacy-note" aria-labelledby="truth-title"><p class="eyebrow">Plain threat model</p><h2 id="truth-title">Useful protection, stated plainly.</h2><div><p><strong>This helps with:</strong> keeping the contents unavailable to someone who gets the ZIP but not its separate password.</p><p><strong>This cannot:</strong> verify the recipient, protect a compromised phone or computer, prevent a recipient from forwarding files, scan files for malware, or guarantee the safety of any channel you choose.</p></div><p>For urgent or regulated needs, follow the requirements of your professional or organisation. This tool makes no medical, legal, or compliance guarantee.</p></section>

    <section class="pro" aria-labelledby="pro-title"><div><p class="eyebrow">One-time Pro unlock</p><h2 id="pro-title">Add a personal note to the handoff sheet.</h2><p>Pro unlocks a custom note on recipient sheets and a printer-ready checklist. The encrypted ZIP, handoff sheet, local log, and exports stay free.</p></div><div id="license-panel"><a class="button button-primary" href="https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout">Buy Pro — one time</a><label for="license-input">Already bought it? Paste your license</label><div class="license-row"><input id="license-input" autocomplete="off" placeholder="License token"><button id="restore-license" class="button button-secondary" type="button">Restore</button></div><p id="license-status" class="microcopy" aria-live="polite"></p></div></section>
  </main>
  <footer><p>Built for careful, human-scale handoffs. <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p><p>Artwork is original AI-generated product artwork; files never leave your device through this app.</p></footer><div id="update-toast" class="update-toast" hidden role="status" aria-live="polite"><span>A newer version is ready.</span><button id="reload-app" class="button button-secondary" type="button">Refresh</button></div>`;

const form = document.querySelector<HTMLFormElement>('#handoff-form')!;
const filesInput = document.querySelector<HTMLInputElement>('#files')!;
const passwordInput = document.querySelector<HTMLInputElement>('#password')!;
const recipientInput = document.querySelector<HTMLInputElement>('#recipient')!;
const savedInput = document.querySelector<HTMLInputElement>('#password-saved')!;
const status = document.querySelector<HTMLDivElement>('#status')!;
let preparedZip: Blob | undefined;
let preparedSheet = '';

function setStatus(message = '', kind: 'error' | 'success' | 'busy' = 'success') { status.textContent = message; status.className = `status ${message ? `status-${kind}` : ''}`; }
function setError(id: string, message = '') { document.querySelector<HTMLElement>(`#${id}`)!.textContent = message; }
function download(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function displayDate(value?: string) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not yet'; }

filesInput.addEventListener('change', () => { const count = filesInput.files?.length || 0; document.querySelector('#file-label')!.textContent = count ? `${count} ${count === 1 ? 'file' : 'files'} selected` : 'Choose files'; setError('file-error'); });
document.querySelector('#generate-password')!.addEventListener('click', () => { passwordInput.value = makePassword(); passwordInput.focus(); setStatus('A new 18-character password is ready. Save it before preparing the packet.'); });

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setError('file-error'); setError('recipient-error'); setError('password-error'); setError('saved-error');
  let valid = true;
  if (!filesInput.files?.length) { setError('file-error', 'Choose at least one file to continue.'); valid = false; }
  if (!recipientInput.value.trim()) { setError('recipient-error', 'Add the recipient’s first name so their sheet is clear.'); valid = false; }
  if (passwordInput.value.length < 12) { setError('password-error', 'Use at least 12 characters for the ZIP password.'); valid = false; }
  if (!savedInput.checked) { setError('saved-error', 'Confirm that you saved the password first.'); valid = false; }
  if (!valid) { setStatus('There are a few details to fix before the packet can be prepared.', 'error'); return; }
  const submit = document.querySelector<HTMLButtonElement>('#prepare')!;
  submit.disabled = true; submit.textContent = 'Encrypting on this device…'; setStatus('Preparing the encrypted ZIP. Large files can take a moment; keep this tab open.', 'busy');
  try {
    const writer = new ZipWriter(new BlobWriter('application/zip'));
    for (const file of Array.from(filesInput.files!)) await writer.add(file.name, new BlobReader(file), { password: passwordInput.value, encryptionStrength: 3 });
    preparedZip = await writer.close();
    preparedSheet = recipientSheet({ recipient: recipientInput.value, fileCount: filesInput.files!.length, delivery: (document.querySelector<HTMLSelectElement>('#delivery')!).value, passwordChannel: (document.querySelector<HTMLSelectElement>('#password-channel')!).value, customNote: proUnlocked ? document.querySelector<HTMLTextAreaElement>('#custom-note')!.value : undefined });
    activeRecord = { id: crypto.randomUUID(), recipient: recipientInput.value.trim(), createdAt: new Date().toISOString(), delivery: (document.querySelector<HTMLSelectElement>('#delivery')!).value, passwordChannel: (document.querySelector<HTMLSelectElement>('#password-channel')!).value };
    await store.put(activeRecord);
    document.querySelector('#kit-recipient')!.textContent = activeRecord.recipient;
    document.querySelector<HTMLElement>('#kit')!.hidden = false;
    document.querySelector<HTMLElement>('#kit')!.focus();
    setStatus('Encrypted ZIP created. Download it and the handoff sheet below.', 'success');
    await renderRecords();
  } catch (error) { console.error(error); setStatus('The ZIP could not be created. Try fewer files, free device memory, or reload and try again.', 'error'); }
  finally { submit.disabled = false; submit.innerHTML = 'Create encrypted ZIP and handoff sheet <span aria-hidden="true">→</span>'; }
});

document.querySelector('#download-zip')!.addEventListener('click', () => preparedZip && download(preparedZip, 'confidential-handoff.zip'));
document.querySelector('#download-sheet')!.addEventListener('click', () => download(new Blob([preparedSheet], { type: 'text/plain;charset=utf-8' }), 'recipient-handoff-instructions.txt'));
document.querySelector('#print-sheet')!.addEventListener('click', () => { const popup = window.open('', '_blank', 'noopener,noreferrer'); if (popup) { popup.document.write(`<pre style="white-space:pre-wrap;font:16px/1.5 system-ui;padding:2rem">${preparedSheet.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</pre>`); popup.document.close(); popup.print(); } });
document.querySelector('#start-again')!.addEventListener('click', () => { form.reset(); filesInput.value = ''; document.querySelector('#file-label')!.textContent = 'Choose files'; preparedZip = undefined; preparedSheet = ''; activeRecord = undefined; document.querySelector<HTMLElement>('#kit')!.hidden = true; form.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); });

async function updateActive(field: 'sentAt' | 'acknowledgedAt', checked: boolean) { if (!activeRecord) return; activeRecord[field] = checked ? new Date().toISOString() : undefined; await store.put(activeRecord); await renderRecords(); }
document.querySelector<HTMLInputElement>('#sent-check')!.addEventListener('change', (event) => updateActive('sentAt', (event.target as HTMLInputElement).checked));
document.querySelector<HTMLInputElement>('#ack-check')!.addEventListener('change', (event) => updateActive('acknowledgedAt', (event.target as HTMLInputElement).checked));

async function renderRecords() {
  const target = document.querySelector<HTMLDivElement>('#record-list')!;
  try {
    const records = await store.all(); target.replaceChildren();
    if (!records.length) { target.innerHTML = '<p class="empty-state">No handoffs logged yet. Preparing a packet creates a private local checklist here.</p>'; return; }
    const list = document.createElement('ul'); list.className = 'record-list';
    records.forEach((record) => { const item = document.createElement('li'); item.innerHTML = `<div><strong></strong><span></span></div><div class="record-state"><span></span><span></span></div>`; item.querySelector('strong')!.textContent = record.recipient; item.querySelector('div span')!.textContent = `Prepared ${displayDate(record.createdAt)} · ZIP: ${record.delivery} · Password: ${record.passwordChannel}`; const states = item.querySelectorAll('.record-state span'); states[0].textContent = record.sentAt ? `Sent ${displayDate(record.sentAt)}` : 'Not marked sent'; states[1].textContent = record.acknowledgedAt ? `Opened ${displayDate(record.acknowledgedAt)}` : 'Not acknowledged'; const remove = document.createElement('button'); remove.className = 'link-button delete'; remove.type = 'button'; remove.textContent = 'Delete log entry'; remove.addEventListener('click', async () => { if (confirm(`Delete the local handoff log for ${record.recipient}? This cannot be undone.`)) { await store.remove(record.id); await renderRecords(); } }); item.append(remove); list.append(item); }); target.append(list);
  } catch { target.innerHTML = '<p class="empty-state">Your browser did not open the private handoff log. You can still create and download a handoff.</p>'; }
}

document.querySelector('#export-records')!.addEventListener('click', async () => { try { download(new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), handoffs: await store.all() }, null, 2)], { type: 'application/json' }), 'confidential-file-handoff-log.json'); } catch { setStatus('The log could not be exported in this browser.', 'error'); } });
document.querySelector<HTMLInputElement>('#import-records')!.addEventListener('change', async (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { const data = JSON.parse(await file.text()); if (!Array.isArray(data.handoffs)) throw new Error('format'); await store.replace(data.handoffs); await renderRecords(); setStatus('The valid handoff log entries were imported.', 'success'); } catch { setStatus('That file is not a valid handoff-log export.', 'error'); } finally { (event.target as HTMLInputElement).value = ''; } });

function storedLicense(): string | null { return localStorage.getItem(LICENSE_KEY); }
function setLicenseStatus(message: string) { document.querySelector('#license-status')!.textContent = message; }
function setProUnlocked(unlocked: boolean) { proUnlocked = unlocked; const note = document.querySelector<HTMLTextAreaElement>('#custom-note')!; const help = document.querySelector<HTMLElement>('#custom-note-help')!; note.disabled = !unlocked; help.textContent = unlocked ? 'Pro is active. This note is included only in the downloaded recipient sheet.' : 'Unlock Pro to add a short note to the recipient handoff sheet.'; }
async function verifyLicense(force = false) { const license = storedLicense(); if (!license) return; const cache = JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) || 'null') as { checkedAt: number; valid: boolean } | null; if (!force && cache && Date.now() - cache.checkedAt < 86_400_000) { setProUnlocked(cache.valid); setLicenseStatus(cache.valid ? 'Pro is unlocked on this device.' : 'This license is not active.'); return; }
  setLicenseStatus('Checking your license…'); try { const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(license)}`); const verdict = await response.json() as { valid: boolean }; localStorage.setItem(LICENSE_CACHE_KEY, JSON.stringify({ checkedAt: Date.now(), valid: verdict.valid })); setProUnlocked(verdict.valid); setLicenseStatus(verdict.valid ? 'Pro is unlocked on this device.' : 'License no longer active. You can purchase a new unlock.'); } catch { setLicenseStatus('Pro remains available from its last local check. We will check again when online.'); }
}
const queryLicense = new URLSearchParams(location.search).get('license'); if (queryLicense) { localStorage.setItem(LICENSE_KEY, queryLicense); setProUnlocked(true); history.replaceState({}, '', location.pathname + location.hash); setLicenseStatus('License saved. Checking it now…'); }
document.querySelector('#restore-license')!.addEventListener('click', () => { const input = document.querySelector<HTMLInputElement>('#license-input')!; if (!input.value.trim()) { setLicenseStatus('Paste a license token first.'); return; } localStorage.setItem(LICENSE_KEY, input.value.trim()); setProUnlocked(true); input.value = ''; verifyLicense(true); });

if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then((registration) => { if (registration.waiting) document.querySelector<HTMLElement>('#update-toast')!.hidden = false; registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) document.querySelector<HTMLElement>('#update-toast')!.hidden = false; }); }); }).catch(() => undefined);
document.querySelector('#reload-app')!.addEventListener('click', () => location.reload());
if (!navigator.onLine) setStatus('You are offline. This app can still prepare files locally; reconnect only to load a new version or check a license.', 'busy');
window.addEventListener('offline', () => setStatus('You are offline. Your files still stay on this device.', 'busy'));
window.addEventListener('online', () => setStatus('You are back online.', 'success'));
renderRecords(); verifyLicense();
setProUnlocked(proUnlocked);
