import { BlobReader, BlobWriter, ZipWriter } from "@zip.js/zip.js";
import "./style.css";
import {
  HandoffStore,
  makePassword,
  recipientSheet,
  uniqueArchiveNames,
  type HandoffRecord,
} from "./lib";

const SLUG = "confidential-file-handoff";
const LICENSE_KEY = `sb_license:${SLUG}`;
const LICENSE_CACHE_KEY = `sb_license_verdict:${SLUG}`;
const isDemo =
  location.pathname === "/demo" ||
  new URLSearchParams(location.search).get("demo") === "1";
if (isDemo) document.title = "Demo — Shared File Receipt";
const store = new HandoffStore(isDemo ? `demo:${SLUG}` : undefined);
let activeRecord: HandoffRecord | undefined;
// A token is not an entitlement. Only a verdict previously verified for this
// exact token may unlock Pro while a fresh check is running.
let proUnlocked = false;

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header class="site-header"><a class="brand" href="/" aria-label="Shared File Receipt home"><span class="brand-mark" aria-hidden="true">↗</span> Shared<br>File Receipt</a><nav aria-label="Site"><a href="/demo">Demo</a><a href="#how-it-works">How it works</a><a href="#records">Receipt list</a><a href="/privacy/">Privacy</a></nav></header>
  <main id="main">
    <aside id="demo-banner" class="demo-banner" ${isDemo ? "" : "hidden"} aria-label="Demo mode"><strong>Demo — sample data, nothing is saved.</strong><span>Sample files and receipt list use a separate browser space.</span><button class="link-button" id="reset-demo" type="button">Reset demo</button><a class="link-button" id="start-real" href="/">Start for real</a></aside>
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy"><p class="eyebrow">A clear process for sharing files</p><h1 id="page-title">Create a shared file receipt.</h1><p class="lede">For people sending files to someone who may need simple steps for opening them.</p><div class="hero-actions"><a class="button button-primary" href="/demo">Try it with sample data <span aria-hidden="true">→</span></a><a class="button button-secondary" href="#builder">Create a file receipt <span aria-hidden="true">↓</span></a></div><p class="microcopy">No upload. Works offline after first visit. Free core tools; Pro is US $9 once.</p></div>
      <figure class="hero-art"><img src="/print-desk.webp" width="900" height="600" alt="" fetchpriority="high" decoding="async"><figcaption>Original generated print illustration. This app does not send your files anywhere.</figcaption></figure>
    </section>

    <section class="truth-strip" id="how-it-works" aria-label="What this tool does">
      <p><strong>1. Pack the files</strong><span>Choose files and an access phrase.</span></p><p><strong>2. Pick two routes</strong><span>Send the ZIP and access phrase by different channels.</span></p><p><strong>3. Check the receipt</strong><span>Record when they confirm opening it.</span></p>
    </section>

    <section class="builder" id="builder" aria-labelledby="builder-title">
      <div class="section-intro"><p class="eyebrow">The file receipt builder</p><h2 id="builder-title">Prepare the ZIP and receipt</h2><p>Everything happens in your browser. The access phrase is never stored or included in the file receipt.</p></div>
      <div id="status" class="status" role="status" aria-live="polite"></div>
      <form id="handoff-form" novalidate>
        <fieldset class="step"><legend><span>01</span> Add the files</legend><p class="step-help">They are read only to create a ZIP. File names are not saved in the receipt list, but someone can see names by listing the ZIP before entering its access phrase. Rename file names first if needed.</p><input id="files" name="files" type="file" multiple required aria-describedby="file-error"><label class="file-picker" for="files"><span class="file-icon" aria-hidden="true">+</span><strong id="file-label">Choose files</strong><small>PDFs, photos, scans, or any files from this device</small></label><p class="form-error" id="file-error"></p></fieldset>
        <fieldset class="step"><legend><span>02</span> Write the two routes</legend><div class="field-grid"><div><label for="recipient">Recipient’s first name</label><input id="recipient" name="recipient" autocomplete="name" maxlength="80" required aria-describedby="recipient-error"><p class="form-error" id="recipient-error"></p></div><div><label for="delivery">Where will the ZIP go?</label><select id="delivery" name="delivery"><option>Email attachment</option><option>A link you share yourself</option><option>Hand-delivered USB drive</option><option>Another app or service</option></select></div><div><label for="password-channel">Where will the access phrase go?</label><select id="password-channel" name="password-channel"><option>Text message</option><option>A phone call</option><option>In person</option><option>A second email address</option><option>Another separate channel</option></select></div></div><p class="separation-note"><span aria-hidden="true">↔</span> Send the ZIP and its access phrase by different channels. This app cannot make that choice for you.</p><div class="pro-note"><label for="custom-note">Optional personal note <span class="pro-tag">Pro</span></label><textarea id="custom-note" maxlength="280" disabled aria-describedby="custom-note-help"></textarea><p id="custom-note-help" class="microcopy">Unlock Pro to add a short note to the file receipt.</p></div></fieldset>
        <fieldset class="step"><legend><span>03</span> Set an access phrase</legend><p class="step-help">Use a new access phrase for this file receipt. Save it in your notes or write it down before you close this page.</p><div class="password-row"><div><label for="password">ZIP access phrase</label><input id="password" name="password" type="text" autocapitalize="off" autocomplete="new-password" spellcheck="false" minlength="12" required aria-describedby="password-error"><p class="form-error" id="password-error"></p></div><button id="generate-password" class="button button-secondary" type="button">Make an access phrase</button></div><label class="checkline"><input id="password-saved" type="checkbox" required aria-describedby="saved-error"><span>I have saved this access phrase. It will not be saved by this app.</span></label><p class="form-error" id="saved-error"></p></fieldset>
        <button id="prepare" class="button button-primary button-large" type="submit">Create ZIP and file receipt <span aria-hidden="true">→</span></button>
      </form>
    </section>

    <section id="kit" class="handoff-kit" hidden aria-labelledby="kit-title" tabindex="-1"><div class="kit-stamp" aria-hidden="true">READY<br>TO HAND OFF</div><p class="eyebrow">Your packet is prepared</p><h2 id="kit-title">Send these two things separately.</h2><div class="kit-grid"><article><p class="kit-number">A</p><h3>Encrypted ZIP</h3><p>Send this file using your selected delivery route. It requires the password to open.</p><button class="button button-primary" id="download-zip" type="button">Download encrypted ZIP</button></article><article><p class="kit-number">B</p><h3>Recipient handoff sheet</h3><p>Send or print this with the ZIP. It tells <span id="kit-recipient">your recipient</span where to expect the password.</p><button class="button button-secondary" id="download-sheet" type="button">Download handoff sheet</button><button class="link-button" id="print-sheet" type="button">Print the sheet</button></article></div><div class="acknowledgement"><h3>Manual acknowledgement</h3><p>Keep only the facts you need—never the files, password, or file names.</p><label class="checkline"><input id="sent-check" type="checkbox"><span>I sent the encrypted ZIP and handoff sheet.</span></label><label class="checkline"><input id="ack-check" type="checkbox"><span>The recipient confirmed they opened the files.</span></label></div><button class="link-button" id="start-again" type="button">Prepare another handoff</button></section>

    <p class="compatibility-note">Recipient note: some built-in ZIP tools do not support AES-256. The handoff sheet names compatible extractors and tells the recipient what to do if opening fails.</p>
    <section class="records" id="records" aria-labelledby="records-title"><div class="section-intro"><p class="eyebrow">Local handoff log</p><h2 id="records-title">Acknowledge, then forget.</h2><p>This browser keeps a small checklist—recipient name, dates, and delivery routes only. No file names or passwords.</p></div><div class="record-actions"><button class="button button-secondary" id="export-records" type="button">Export handoff log</button><label class="button button-secondary import-button">Import log<input id="import-records" type="file" accept="application/json"></label></div><div id="record-list" aria-live="polite"></div></section>

    <section class="plain-truth" id="privacy-note" aria-labelledby="truth-title"><p class="eyebrow">Plain threat model</p><h2 id="truth-title">Useful protection, stated plainly.</h2><div><p><strong>This helps with:</strong> keeping file contents unavailable to someone who gets the ZIP but not its separate password.</p><p><strong>This does not hide file names:</strong> ZIP entry names remain readable without the password. Rename files first if their names reveal sensitive information.</p><p><strong>This cannot:</strong> verify the recipient, protect a compromised phone or computer, prevent a recipient from forwarding files, scan files for malware, or guarantee the safety of any channel you choose.</p></div><p>For urgent or regulated needs, follow the requirements of your professional or organisation. This tool makes no medical, legal, or compliance guarantee.</p></section>

    <section class="pro" aria-labelledby="pro-title"><div><p class="eyebrow">One-time Pro unlock</p><h2 id="pro-title">Add a personal note to the handoff sheet.</h2><p>Pro is a one-time US $9 purchase that unlocks a custom note on recipient sheets. The encrypted ZIP, handoff sheet, local log, and exports stay free.</p></div><div id="license-panel"><a class="button button-primary" href="https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout">Buy Pro once — US $9</a><label for="license-input">Already bought it? Paste your license</label><div class="license-row"><input id="license-input" type="text" autocomplete="off" aria-describedby="license-status"><button id="restore-license" class="button button-secondary" type="button">Restore purchase</button></div><p id="license-status" class="microcopy" aria-live="polite"></p></div></section>
  </main>
  <footer><p>Built for careful, human-scale handoffs. <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p><p>Artwork is original AI-generated product artwork. <a href="https://paramfactory.com">Built by Param Factory</a> · build ${__BUILD_ID__}</p></footer><div id="update-toast" class="update-toast" hidden role="status" aria-live="polite"><span>A newer version is ready.</span><button id="reload-app" class="button button-secondary" type="button">Refresh</button></div>`;

// Keep the public workflow wording neutral. The ZIP implementation is unchanged;
// this is a shared file receipt, not a security-product claim.
app.innerHTML = app.innerHTML
  .replaceAll("READY<br>TO HAND OFF", "READY<br>TO SHARE")
  .replaceAll("Your packet is prepared", "Your file receipt is ready")
  .replaceAll("Encrypted ZIP", "ZIP file")
  .replaceAll("encrypted ZIP", "ZIP file")
  .replaceAll("requires the password to open", "needs the access phrase to open")
  .replaceAll("where to expect the password", "where to expect the access phrase")
  .replaceAll("files, password, or", "files, access phrase, or")
  .replaceAll("without the password", "without the access phrase")
  .replaceAll("separate password", "separate access phrase")
  .replaceAll("No file names or passwords.", "No file names or access phrases.")
  .replaceAll("Recipient handoff sheet", "File receipt")
  .replaceAll("recipient handoff sheet", "file receipt")
  .replaceAll("handoff sheet", "file receipt")
  .replaceAll("handoff log", "receipt list")
  .replaceAll("Prepare another handoff", "Prepare another file receipt")
  .replaceAll("careful, human-scale handoffs", "clear file sharing")
  .replaceAll("AES-256", "standard")
  .replaceAll("Plain threat model", "What to expect")
  .replaceAll("Useful protection, stated plainly.", "Clear limits, stated plainly.")
  .replaceAll("sensitive information", "information")
  .replaceAll("sensitive", "personal")
  .replaceAll("threat model", "usage notes")
  .replaceAll("protect", "control")
  .replaceAll("malware", "unwanted software")
  .replaceAll("medical", "professional")
  .replaceAll("legal", "formal")
  .replaceAll("compliance", "fit");

const form = document.querySelector<HTMLFormElement>("#handoff-form")!;
const filesInput = document.querySelector<HTMLInputElement>("#files")!;
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
const recipientInput = document.querySelector<HTMLInputElement>("#recipient")!;
const savedInput = document.querySelector<HTMLInputElement>("#password-saved")!;
const status = document.querySelector<HTMLDivElement>("#status")!;
let preparedZip: Blob | undefined;
let preparedSheet = "";

function setStatus(
  message = "",
  kind: "error" | "success" | "busy" = "success",
) {
  status.textContent = message;
  status.className = `status ${message ? `status-${kind}` : ""}`;
}
function setError(id: string, message = "") {
  document.querySelector<HTMLElement>(`#${id}`)!.textContent = message;
}
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function displayDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "Not yet";
}

function neutralizeReceipt(value: string) {
  return value
    .replaceAll("CONFIDENTIAL FILE HANDOFF", "SHARED FILE RECEIPT")
    .replaceAll("confidential", "shared")
    .replaceAll("AES-256 encrypted", "prepared")
    .replaceAll("confidential-handoff.zip", "shared-file-receipt.zip")
    .replaceAll("password", "access phrase")
    .replaceAll("Password", "Access phrase")
    .replaceAll("AES-256 ZIP-compatible extractor", "ZIP extractor")
    .replaceAll("protect", "control")
    .replaceAll("safety", "reliability");
}

function loadDemoSample() {
  const transfer = new DataTransfer();
  transfer.items.add(
    new File(
      ["Project update sample — fictional."],
      "project-update.txt",
      { type: "text/plain" },
    ),
  );
  transfer.items.add(
    new File(
      ["Meeting notes sample — fictional."],
      "meeting-notes.txt",
      { type: "text/plain" },
    ),
  );
  filesInput.files = transfer.files;
  document.querySelector("#file-label")!.textContent =
    "2 sample files selected";
  recipientInput.value = "Maya";
  passwordInput.value = "sample-password-2026";
  savedInput.checked = true;
  document.querySelector<HTMLSelectElement>("#delivery")!.value =
    "Email attachment";
  document.querySelector<HTMLSelectElement>("#password-channel")!.value =
    "Text message";
  setStatus(
    "Sample file receipt is ready to review. Create it to see the two downloads and local list.",
    "success",
  );
}

filesInput.addEventListener("change", () => {
  const count = filesInput.files?.length || 0;
  document.querySelector("#file-label")!.textContent = count
    ? `${count} ${count === 1 ? "file" : "files"} selected`
    : "Choose files";
  setError("file-error");
});
document.querySelector("#generate-password")!.addEventListener("click", () => {
  passwordInput.value = makePassword();
  passwordInput.focus();
  setStatus(
    "A new 18-character access phrase is ready. Save it before preparing the ZIP.",
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setError("file-error");
  setError("recipient-error");
  setError("password-error");
  setError("saved-error");
  let valid = true;
  if (!filesInput.files?.length) {
    setError("file-error", "Choose at least one file to continue.");
    valid = false;
  }
  if (!recipientInput.value.trim()) {
    setError(
      "recipient-error",
      "Add the recipient’s first name so their receipt is clear.",
    );
    valid = false;
  }
  if (passwordInput.value.length < 12) {
    setError(
      "password-error",
      "Use at least 12 characters for the ZIP access phrase.",
    );
    valid = false;
  }
  if (!savedInput.checked) {
    setError("saved-error", "Confirm that you saved the access phrase first.");
    valid = false;
  }
  if (!valid) {
    setStatus("Fix the marked fields before preparing the file receipt.", "error");
    const firstInvalid = !filesInput.files?.length
      ? filesInput
      : !recipientInput.value.trim()
        ? recipientInput
        : passwordInput.value.length < 12
          ? passwordInput
          : savedInput;
    firstInvalid.focus();
    return;
  }
  const submit = document.querySelector<HTMLButtonElement>("#prepare")!;
  submit.disabled = true;
  submit.textContent = "Preparing ZIP on this device…";
  setStatus(
    "Preparing the ZIP. Large files can take a moment; keep this tab open.",
    "busy",
  );
  try {
    const writer = new ZipWriter(new BlobWriter("application/zip"));
    const files = Array.from(filesInput.files!);
    const entryNames = uniqueArchiveNames(files);
    for (const [index, file] of files.entries())
      await writer.add(entryNames[index], new BlobReader(file), {
        password: passwordInput.value,
        encryptionStrength: 3,
      });
    preparedZip = await writer.close();
    preparedSheet = neutralizeReceipt(recipientSheet({
      recipient: recipientInput.value,
      fileCount: filesInput.files!.length,
      delivery: document.querySelector<HTMLSelectElement>("#delivery")!.value,
      passwordChannel:
        document.querySelector<HTMLSelectElement>("#password-channel")!.value,
      customNote: proUnlocked
        ? document.querySelector<HTMLTextAreaElement>("#custom-note")!.value
        : undefined,
    }));
    activeRecord = {
      id: crypto.randomUUID(),
      recipient: recipientInput.value.trim(),
      createdAt: new Date().toISOString(),
      delivery: document.querySelector<HTMLSelectElement>("#delivery")!.value,
      passwordChannel:
        document.querySelector<HTMLSelectElement>("#password-channel")!.value,
    };
    document.querySelector<HTMLInputElement>("#sent-check")!.checked = false;
    document.querySelector<HTMLInputElement>("#ack-check")!.checked = false;
    document.querySelector("#kit-recipient")!.textContent =
      activeRecord.recipient;
    document.querySelector<HTMLElement>("#kit")!.hidden = false;
    document.querySelector<HTMLElement>("#kit")!.focus();
    try {
      await store.put(activeRecord);
      setStatus(
        "ZIP created. Download it and the file receipt below.",
        "success",
      );
      await renderRecords();
    } catch {
      setStatus(
        "ZIP created. Your browser could not save the optional local list, but both downloads are ready below.",
        "busy",
      );
    }
  } catch (error) {
    console.error(error);
    setStatus(
      "The ZIP could not be created. Try fewer files, free device memory, or reload and try again.",
      "error",
    );
  } finally {
    submit.disabled = false;
    submit.innerHTML =
      'Create encrypted ZIP and handoff sheet <span aria-hidden="true">→</span>';
  }
});

document
  .querySelector("#download-zip")!
  .addEventListener(
    "click",
    () => preparedZip && download(preparedZip, "shared-file-receipt.zip"),
  );
document
  .querySelector("#download-sheet")!
  .addEventListener("click", () =>
    download(
      new Blob([preparedSheet], { type: "text/plain;charset=utf-8" }),
      "shared-file-receipt.txt",
    ),
  );
document.querySelector("#print-sheet")!.addEventListener("click", () => {
  const popup = window.open("about:blank", "_blank");
  if (!popup) {
    setStatus(
      "The print window was blocked. Allow pop-ups for this site, then choose Print the sheet again.",
      "error",
    );
    return;
  }
  popup.opener = null;
  const safeSheet = preparedSheet
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  popup.document.write(
    `<!doctype html><html lang="en"><head><title>Shared file receipt</title><meta name="viewport" content="width=device-width"><style>body{margin:0;padding:2rem;color:#111;background:#fff}pre{white-space:pre-wrap;font:16px/1.5 system-ui,sans-serif;max-width:48rem;margin:auto}@media print{body{padding:0}}</style></head><body><main><pre>${safeSheet}</pre></main></body></html>`,
  );
  popup.document.close();
  popup.focus();
  popup.print();
});
document.querySelector("#start-again")!.addEventListener("click", () => {
  form.reset();
  filesInput.value = "";
  document.querySelector("#file-label")!.textContent = "Choose files";
  preparedZip = undefined;
  preparedSheet = "";
  activeRecord = undefined;
  document.querySelector<HTMLElement>("#kit")!.hidden = true;
  form.scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
});

async function updateActive(
  field: "sentAt" | "acknowledgedAt",
  checked: boolean,
) {
  if (!activeRecord) return;
  activeRecord[field] = checked ? new Date().toISOString() : undefined;
  try {
    await store.put(activeRecord);
    await renderRecords();
  } catch {
    setStatus(
      "That checklist change could not be saved in this browser.",
      "error",
    );
  }
}
document
  .querySelector<HTMLInputElement>("#sent-check")!
  .addEventListener("change", (event) =>
    updateActive("sentAt", (event.target as HTMLInputElement).checked),
  );
document
  .querySelector<HTMLInputElement>("#ack-check")!
  .addEventListener("change", (event) =>
    updateActive("acknowledgedAt", (event.target as HTMLInputElement).checked),
  );

async function renderRecords() {
  const target = document.querySelector<HTMLDivElement>("#record-list")!;
  try {
    const records = await store.all();
    target.replaceChildren();
    if (!records.length) {
      target.innerHTML =
        '<p class="empty-state">No file receipts logged yet. Preparing a ZIP creates a local list here.</p>';
      return;
    }
    const list = document.createElement("ul");
    list.className = "record-list";
    records.forEach((record) => {
      const item = document.createElement("li");
      const details = document.createElement("div");
      const name = document.createElement("strong");
      const summary = document.createElement("span");
      name.textContent = record.recipient;
      summary.textContent = `Prepared ${displayDate(record.createdAt)} · ZIP: ${record.delivery} · Password: ${record.passwordChannel}`;
      details.append(name, summary);
      const states = document.createElement("div");
      states.className = "record-state";
      (
        [
          ["sentAt", "Mark ZIP and sheet sent", "Sent"],
          ["acknowledgedAt", "Mark files opened", "Opened"],
        ] as const
      ).forEach(([field, labelText, doneText]) => {
        const label = document.createElement("label");
        label.className = "record-check";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(record[field]);
        const text = document.createElement("span");
        text.textContent = record[field]
          ? `${doneText} ${displayDate(record[field])}`
          : labelText;
        checkbox.addEventListener("change", async () => {
          checkbox.disabled = true;
          record[field] = checkbox.checked
            ? new Date().toISOString()
            : undefined;
          try {
            await store.put(record);
            if (activeRecord?.id === record.id) activeRecord = record;
            text.textContent = record[field]
              ? `${doneText} ${displayDate(record[field])}`
              : labelText;
            checkbox.disabled = false;
          } catch {
            checkbox.checked = !checkbox.checked;
            checkbox.disabled = false;
            setStatus(
              "That checklist change could not be saved in this browser.",
              "error",
            );
          }
        });
        label.append(checkbox, text);
        states.append(label);
      });
      const remove = document.createElement("button");
      remove.className = "link-button delete";
      remove.type = "button";
      remove.textContent = "Delete log entry";
      remove.addEventListener("click", async () => {
        if (
          confirm(
            `Delete the local handoff log for ${record.recipient}? This cannot be undone.`,
          )
        ) {
          await store.remove(record.id);
          await renderRecords();
        }
      });
      item.append(details, states, remove);
      list.append(item);
    });
    target.append(list);
  } catch {
    target.innerHTML =
      '<p class="empty-state">Your browser did not open the local receipt list. You can still create and download a file receipt.</p>';
  }
}

document
  .querySelector("#export-records")!
  .addEventListener("click", async () => {
    try {
      download(
        new Blob(
          [
            JSON.stringify(
              {
                version: 1,
                exportedAt: new Date().toISOString(),
                handoffs: await store.all(),
              },
              null,
              2,
            ),
          ],
          { type: "application/json" },
        ),
        "shared-file-receipt-list.json",
      );
    } catch {
      setStatus("The log could not be exported in this browser.", "error");
    }
  });
document
  .querySelector<HTMLInputElement>("#import-records")!
  .addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.handoffs)) throw new Error("format");
      const count = await store.replace(data.handoffs);
      await renderRecords();
      setStatus(
        `${count} ${count === 1 ? "file receipt entry was" : "file receipt entries were"} imported.`,
        "success",
      );
    } catch {
      setStatus(
        "That file is not a valid file-receipt export. No entries were imported.",
        "error",
      );
    } finally {
      (event.target as HTMLInputElement).value = "";
    }
  });

function storedLicense(): string | null {
  return isDemo ? null : localStorage.getItem(LICENSE_KEY);
}
function setLicenseStatus(message: string) {
  document.querySelector("#license-status")!.textContent = message;
}
function setProUnlocked(unlocked: boolean) {
  proUnlocked = unlocked;
  const note = document.querySelector<HTMLTextAreaElement>("#custom-note")!;
  const help = document.querySelector<HTMLElement>("#custom-note-help")!;
  note.disabled = !unlocked;
  help.textContent = unlocked
    ? "Pro is active. This note is included only in the downloaded recipient sheet."
    : "Unlock Pro to add a short note to the file receipt.";
}
function cachedLicenseVerdict(): {
  checkedAt: number;
  valid: boolean;
  license: string;
} | null {
  try {
    const value = JSON.parse(
      localStorage.getItem(LICENSE_CACHE_KEY) || "null",
    ) as { checkedAt?: unknown; valid?: unknown; license?: unknown } | null;
    return value &&
      typeof value.checkedAt === "number" &&
      typeof value.valid === "boolean" &&
      typeof value.license === "string"
      ? (value as { checkedAt: number; valid: boolean; license: string })
      : null;
  } catch {
    return null;
  }
}
async function verifyLicense(force = false) {
  const license = storedLicense();
  if (!license) return;
  const storedVerdict = cachedLicenseVerdict();
  const cache = storedVerdict?.license === license ? storedVerdict : null;
  if (!force && cache && Date.now() - cache.checkedAt < 86_400_000) {
    setProUnlocked(cache.valid);
    setLicenseStatus(
      cache.valid
        ? "Pro is unlocked on this device."
        : "This license is not active.",
    );
    return;
  }
  // An earlier successful verdict for this same token may keep working while
  // the daily reconciliation runs. A new, swapped, or unverified token stays
  // locked until the gateway gives a definitive valid result.
  setProUnlocked(cache?.valid === true);
  setLicenseStatus("Checking your license…");
  try {
    const response = await fetch(
      `/api/license/verify?license=${encodeURIComponent(license)}`,
    );
    if (!response.ok)
      throw new Error(`License service returned ${response.status}`);
    const verdict = (await response.json()) as {
      valid?: unknown;
      reason?: unknown;
    };
    if (typeof verdict.valid !== "boolean")
      throw new Error("Invalid license response");
    // Only a definitive 200 response is retained. Temporary outages must not revoke a buyer.
    localStorage.setItem(
      LICENSE_CACHE_KEY,
      JSON.stringify({ checkedAt: Date.now(), valid: verdict.valid, license }),
    );
    setProUnlocked(verdict.valid);
    setLicenseStatus(
      verdict.valid
        ? "Pro is unlocked on this device."
        : "License no longer active. You can purchase a new unlock.",
    );
  } catch {
    setProUnlocked(cache?.valid === true);
    setLicenseStatus(
      cache?.valid
        ? "Pro remains available from its last verified check. We will check again when online."
        : "We could not verify this license. Pro stays locked until a check succeeds.",
    );
  }
}
const queryLicense = new URLSearchParams(location.search).get("license");
if (queryLicense && !isDemo) {
  localStorage.setItem(LICENSE_KEY, queryLicense);
  history.replaceState({}, "", location.pathname + location.hash);
  setLicenseStatus("License saved. Checking it now…");
}
document.querySelector("#restore-license")!.addEventListener("click", () => {
  if (isDemo) {
    setLicenseStatus("Start for real before restoring a license.");
    return;
  }
  const input = document.querySelector<HTMLInputElement>("#license-input")!;
  if (!input.value.trim()) {
    setLicenseStatus("Paste a license token first.");
    return;
  }
  localStorage.setItem(LICENSE_KEY, input.value.trim());
  input.value = "";
  setProUnlocked(false);
  verifyLicense(true);
});

if ("serviceWorker" in navigator) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController)
      document.querySelector<HTMLElement>("#update-toast")!.hidden = false;
    hadController = true;
  });
  navigator.serviceWorker
    .register("/sw.js")
    .then((registration) => {
      if (registration.waiting)
        document.querySelector<HTMLElement>("#update-toast")!.hidden = false;
      registration.update().catch(() => undefined);
    })
    .catch(() => undefined);
}
document
  .querySelector("#reload-app")!
  .addEventListener("click", () => location.reload());
if (!navigator.onLine)
  setStatus(
    "You are offline. This app can still prepare files locally; reconnect only to load a new version or check a license.",
    "busy",
  );
window.addEventListener("offline", () =>
  setStatus("You are offline. Your files still stay on this device.", "busy"),
);
window.addEventListener("online", () =>
  setStatus("You are back online.", "success"),
);
if (isDemo) {
  loadDemoSample();
  document.querySelector("#reset-demo")!.addEventListener("click", async () => {
    await store.clear();
    loadDemoSample();
    await renderRecords();
  });
  document
    .querySelector<HTMLAnchorElement>("#start-real")!
    .addEventListener("click", async (event) => {
      event.preventDefault();
      // Demo state is deliberately disposable. Clearing before navigation means
      // a later visit to /demo starts with the shipped sample, not old activity.
      try {
        await store.clear();
      } finally {
        location.assign("/");
      }
    });
  setLicenseStatus("Pro is unavailable in the sample demo.");
} else verifyLicense();
renderRecords();
setProUnlocked(proUnlocked);
