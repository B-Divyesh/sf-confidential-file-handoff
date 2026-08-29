import { readFile } from "node:fs/promises";
import axe from "axe-core";
import { BlobReader, BlobWriter, ZipReader } from "@zip.js/zip.js";
import { expect, test, type Page } from "@playwright/test";

async function preparePacket(page: Page, names = ["scan.pdf"]) {
  await page.locator("#files").setInputFiles(
    names.map((name, index) => ({
      name,
      mimeType: "text/plain",
      buffer: Buffer.from(`private file ${index + 1}`),
    })),
  );
  await page.locator("#recipient").fill("Maya");
  await page.locator("#password").fill("correct horse battery staple");
  await page.locator("#password-saved").check();
  await page.locator("#prepare").click();
  await expect(page.locator("#kit")).toBeVisible();
}

test("duplicate names produce a decryptable packet and delayed acknowledgements persist", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#update-toast")).toBeHidden();
  await preparePacket(page, ["scan.pdf", "scan.pdf"]);

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-zip").click();
  const download = await downloadPromise;
  const archive = new Blob([await readFile((await download.path()) as string)]);
  const reader = new ZipReader(new BlobReader(archive));
  const entries = await reader.getEntries();
  expect(entries.map((entry) => entry.filename)).toEqual([
    "scan.pdf",
    "scan (2).pdf",
  ]);
  const extracted = await entries[1].getData!(new BlobWriter(), {
    password: "correct horse battery staple",
  });
  expect(await extracted.text()).toBe("private file 2");
  await expect(
    entries[0].getData!(new BlobWriter(), { password: "wrong password" }),
  ).rejects.toThrow();
  await reader.close();

  await page.reload();
  await expect(page.getByText("Maya", { exact: true })).toBeVisible();
  await page
    .getByLabel("Mark ZIP and sheet sent")
    .evaluate((element: HTMLInputElement) => element.click());
  await expect(page.locator(".record-state")).toContainText("Sent");
  await page
    .getByLabel("Mark files opened")
    .evaluate((element: HTMLInputElement) => element.click());
  await expect(page.locator(".record-state")).toContainText("Opened");
  await page.reload();
  await expect(page.locator(".record-state")).toContainText("Sent");
  await expect(page.locator(".record-state")).toContainText("Opened");
  expect(errors).toEqual([]);
});

test("print contains the recipient sheet instead of a blank page", async ({
  page,
}) => {
  await page.goto("/");
  await preparePacket(page);
  const popupPromise = page.waitForEvent("popup");
  await page.locator("#print-sheet").click();
  const popup = await popupPromise;
  await expect(popup.locator("pre")).toContainText("CONFIDENTIAL FILE HANDOFF");
  await expect(popup.locator("pre")).toContainText(
    "confidential-file-handoff.zip",
  );
  await expect(popup.locator("pre")).toContainText(
    "AES-256 ZIP-compatible extractor",
  );
  await popup.close();
});

test("blocked IndexedDB does not block the prepared downloads", async ({
  browser,
}) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: {
        open: () => {
          throw new DOMException("blocked", "SecurityError");
        },
      },
    });
  });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await preparePacket(page);
  await expect(page.locator("#status")).toContainText(
    "both downloads are ready",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-zip").click();
  expect((await downloadPromise).suggestedFilename()).toBe(
    "confidential-file-handoff.zip",
  );
  expect(errors).toEqual([]);
  await context.close();
});

test("invalid or secret-bearing imports are rejected without poisoning the log", async ({
  page,
}) => {
  await page.goto("/");
  const poisoned = JSON.stringify({
    handoffs: [
      {
        id: "bad",
        recipient: "Maya",
        createdAt: "not-a-date",
        delivery: "Email",
        passwordChannel: "Text",
        password: "do-not-store",
        fileName: "secret.pdf",
      },
    ],
  });
  await page.locator("#import-records").setInputFiles({
    name: "poison.json",
    mimeType: "application/json",
    buffer: Buffer.from(poisoned),
  });
  await expect(page.locator("#status")).toContainText(
    "No entries were imported",
  );
  await page.reload();
  await expect(page.locator("#record-list")).toContainText(
    "No handoffs logged yet",
  );
  const rows = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const all = request.result
            .transaction("handoffs")
            .objectStore("handoffs")
            .getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
  );
  expect(rows).toEqual([]);
});

test("legacy poisoned rows are removed or stripped before the log renders", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    async () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction(
            "handoffs",
            "readwrite",
          );
          const store = transaction.objectStore("handoffs");
          store.put({
            id: "safe",
            recipient: "Maya",
            createdAt: "2026-01-01T00:00:00.000Z",
            delivery: "Email",
            passwordChannel: "Text",
            password: "legacy-secret",
            fileName: "secret.pdf",
          });
          store.put({
            id: "broken",
            recipient: "Broken",
            createdAt: "not-a-date",
            delivery: "Email",
            passwordChannel: "Text",
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
  await page.reload();
  await expect(page.getByText("Maya", { exact: true })).toBeVisible();
  await expect(page.getByText("Broken", { exact: true })).toHaveCount(0);
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          new Promise<unknown[]>((resolve, reject) => {
            const request = indexedDB.open("confidential-file-handoff", 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const all = request.result
                .transaction("handoffs")
                .objectStore("handoffs")
                .getAll();
              all.onsuccess = () => resolve(all.result);
              all.onerror = () => reject(all.error);
            };
          }),
      ),
    )
    .toEqual([
      {
        id: "safe",
        recipient: "Maya",
        createdAt: "2026-01-01T00:00:00.000Z",
        delivery: "Email",
        passwordChannel: "Text",
      },
    ]);
});

test("@claim:license-token-handling stores a returned token and posts it only to the same-origin license gateway", async ({
  page,
}) => {
  let requestURL = "";
  let requestMethod = "";
  let requestBody = "";
  await page.route("**/api/license/verify", async (route) => {
    requestURL = route.request().url();
    requestMethod = route.request().method();
    requestBody = route.request().postData() || "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: false,
        reason: "invalid",
        expires_at: null,
      }),
    });
  });
  await page.goto("/?license=returned-test-token");
  await expect(page).toHaveURL("/");
  await expect(page.locator("#license-status")).toContainText(
    "License no longer active",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sb_license:confidential-file-handoff"),
    ),
  ).toBe("returned-test-token");
  expect(new URL(requestURL).pathname).toBe("/api/license/verify");
  expect(new URL(requestURL).search).toBe("");
  expect(new URL(requestURL).origin).toBe("http://127.0.0.1:4173");
  expect(requestMethod).toBe("POST");
  expect(JSON.parse(requestBody)).toEqual({ license: "returned-test-token" });
  await expect(page.locator("#custom-note")).toBeDisabled();
});

test("@claim:demo-sandbox one click opens a populated isolated demo in the mobile viewport", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.evaluate(
    async () =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("confidential-file-handoff", 1);
        request.onupgradeneeded = () =>
          request.result.createObjectStore("handoffs", { keyPath: "id" });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const transaction = request.result.transaction(
            "handoffs",
            "readwrite",
          );
          transaction.objectStore("handoffs").put({
            id: "real-record",
            recipient: "Real recipient",
            createdAt: "2026-01-01T00:00:00.000Z",
            delivery: "In person",
            passwordChannel: "Phone call",
          });
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        };
      }),
  );
  await page.getByRole("link", { name: /Try it with sample data/ }).click();
  await expect(page).toHaveURL("/?demo=1");
  await expect(
    page.getByText("Demo — sample data, nothing is saved."),
  ).toBeVisible();
  await expect(page.getByText("project-update.txt")).toBeInViewport();
  await expect(page.getByText("meeting-notes.txt")).toBeInViewport();
  await expect(page.getByText("Maya", { exact: true })).toBeInViewport();
  await expect(page.locator("#create-demo")).toBeInViewport();
  await expect(page.getByText("Real recipient")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sb_license:confidential-file-handoff"),
    ),
  ).toBeNull();
  await expect(page.locator("#record-list")).toContainText(
    "No handoffs logged yet",
  );
  const databases = await page.evaluate(() => indexedDB.databases());
  expect(databases.map(({ name }) => name).sort()).toEqual([
    "confidential-file-handoff",
    "demo:confidential-file-handoff",
  ]);
  const realRecords = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const all = request.result
            .transaction("handoffs")
            .objectStore("handoffs")
            .getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
  );
  expect(realRecords).toHaveLength(1);
  await context.close();
});

test("@claim:demo-reset reset clears the demo log and restores the shipped sample", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  await expect(page.locator("#record-list")).toContainText("Maya");
  await page.locator("#reset-demo").click();
  await expect(page.locator("#file-label")).toHaveText(
    "2 sample files selected",
  );
  await expect(page.locator("#record-list")).toContainText(
    "No handoffs logged yet",
  );
  await expect(page.locator("#create-demo")).toBeInViewport();
});

test("@claim:handoff-sheet-routes the sheet names the ZIP and both separate routes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Create a protected ZIP with opening instructions.",
  );
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const zipDownload = page.waitForEvent("download");
  await page.locator("#download-zip").click();
  expect((await zipDownload).suggestedFilename()).toBe(
    "confidential-file-handoff.zip",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-sheet").click();
  const receipt = await readFile(
    (await (await downloadPromise).path()) as string,
    "utf8",
  );
  expect(receipt).toContain("confidential-file-handoff.zip");
  expect(receipt).toContain("protected AES-256 ZIP");
  expect(receipt).toContain(
    "ZIP access phrase will arrive separately by Text message",
  );
  expect(receipt).not.toMatch(
    /\ban prepared ZIP folder\b|\ba access phrase\b|\ban ZIP extractor\b/i,
  );
});

test("@claim:encrypted-local-zip demo creates a decryptable AES-256 ZIP", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#create-demo").click();
  await expect(page.locator("#kit")).toBeVisible();
  await page.locator("#download-zip").click();
  const download = await downloadPromise;
  const reader = new ZipReader(
    new BlobReader(
      new Blob([await readFile((await download.path()) as string)]),
    ),
  );
  const entries = await reader.getEntries();
  expect(entries).toHaveLength(2);
  for (const entry of entries) {
    expect(entry.encrypted).toBe(true);
    expect(entry.zipCrypto).toBe(false);
    expect(entry.extraFieldAES?.strength).toBe(3);
  }
  await expect(entries[0].getData!(new BlobWriter())).rejects.toThrow();
  await expect(
    entries[0].getData!(new BlobWriter(), { password: "wrong-password" }),
  ).rejects.toThrow();
  await expect(
    entries[0].getData!(new BlobWriter(), { password: "sample-password-2026" }),
  ).resolves.toBeInstanceOf(Blob);
  await reader.close();
});

test("@claim:zip-entry-names-visible protected ZIP names can be listed without the access phrase", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#create-demo").click();
  await page.locator("#download-zip").click();
  const download = await downloadPromise;
  const reader = new ZipReader(
    new BlobReader(
      new Blob([await readFile((await download.path()) as string)]),
    ),
  );
  const entries = await reader.getEntries();
  expect(entries.map(({ filename }) => filename)).toEqual([
    "project-update.txt",
    "meeting-notes.txt",
  ]);
  expect(entries.every(({ encrypted }) => encrypted)).toBe(true);
  await reader.close();
});

test("@claim:handoff-sheet-compatibility sheet gives exact extractor and failure guidance", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-sheet").click();
  const sheet = await readFile(
    (await (await downloadPromise).path()) as string,
    "utf8",
  );
  expect(sheet).toContain("7-Zip (Windows)");
  expect(sheet).toContain("Keka (macOS)");
  expect(sheet).toContain("PeaZip (Windows, macOS, or Linux)");
  expect(sheet).toContain(
    "tell your sender what device and app you are using",
  );
});

test("@claim:no-recipient-verification creates a handoff without an identity check", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await page.locator("#files").setInputFiles({
    name: "example.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("example"),
  });
  await page.locator("#recipient").fill("Unverified recipient");
  await page.locator("#password").fill("correct horse battery staple");
  await page.locator("#password-saved").check();
  await expect(
    page.locator(
      'input[type="email"], input[type="tel"], input[name*="identity" i]',
    ),
  ).toHaveCount(0);
  await page.locator("#prepare").click();
  await expect(page.locator("#kit")).toBeVisible();
  expect(requests.some((url) => /identity|recipient.*verify/i.test(url))).toBe(
    false,
  );
});

test("@claim:offline-after-first-visit demo reloads and creates a packet offline", async ({
  page,
  context,
}) => {
  await page.goto("/?demo=1");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await context.setOffline(true);
  await page.reload();
  await page.locator("#create-demo").click();
  await expect(page.locator("#kit")).toBeVisible();
  await context.setOffline(false);
});

test("@claim:local-log-export demo exports only checklist fields", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export-records").click();
  const download = await downloadPromise;
  const contents = JSON.parse(
    await readFile((await download.path()) as string, "utf8"),
  ) as { handoffs: Array<Record<string, unknown>> };
  expect(Object.keys(contents.handoffs[0]).sort()).toEqual([
    "createdAt",
    "delivery",
    "id",
    "passwordChannel",
    "recipient",
  ]);
});

test("@claim:license-cache-ttl a verdict is reused below 24 hours and refreshed at the boundary", async ({
  page,
}) => {
  await page.route("**/api/license/verify", async (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ valid: false, reason: "unavailable" }),
    }),
  );
  await page.goto("/?license=not-a-real-license");
  await expect(page.locator("#custom-note")).toBeDisabled();
  await expect(page.locator("#license-status")).toContainText(
    "Pro stays locked",
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sb_license_verdict:confidential-file-handoff"),
    ),
  ).toBeNull();
  await page.evaluate(() =>
    localStorage.setItem(
      "sb_license_verdict:confidential-file-handoff",
      JSON.stringify({
        checkedAt: Date.now() - 86_399_000,
        valid: true,
        license: "not-a-real-license",
      }),
    ),
  );
  await page.reload();
  await expect(page.locator("#custom-note")).toBeEnabled();
  await expect(page.locator("#license-status")).toContainText("unlocked");
  await page.evaluate(() =>
    localStorage.setItem(
      "sb_license_verdict:confidential-file-handoff",
      JSON.stringify({
        checkedAt: Date.now() - 86_400_001,
        valid: true,
        license: "not-a-real-license",
      }),
    ),
  );
  await page.reload();
  await expect(page.locator("#license-status")).toContainText(
    "last verified check",
  );
  const cache = await page.evaluate(() =>
    localStorage.getItem("sb_license_verdict:confidential-file-handoff"),
  );
  expect(JSON.parse(cache || "{}").valid).toBe(true);
});

test("@claim:pro-note-entitlement only a verified token adds a personal note to the handoff sheet", async ({
  page,
}) => {
  await page.route("**/api/license/verify", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: true,
        reason: "ok",
        expires_at: null,
      }),
    });
  });
  await page.goto("/?license=verified-qa-token");
  await expect(page.locator("#custom-note")).toBeEnabled();
  await page.locator("#custom-note").fill("Please call after opening.");
  await preparePacket(page);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-sheet").click();
  expect(
    await readFile((await (await downloadPromise).path()) as string, "utf8"),
  ).toContain("Please call after opening.");
});

test("@claim:demo-exit-discard leaving the demo clears its checklist before real mode", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  await expect(page.locator("#record-list")).toContainText("Maya");
  await Promise.all([
    page.waitForURL("/"),
    page.locator("#start-real").click(),
  ]);
  await page.goto("/?demo=1");
  await expect(page.locator("#record-list")).toContainText(
    "No handoffs logged yet",
  );
});

test("@claim:local-log-fields the handoff log stores only recipient, dates, and routes", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  await expect(page.locator("#record-list")).toContainText("Maya");
  const stored = await page.evaluate(
    async () =>
      new Promise<Record<string, unknown>[]>((resolve, reject) => {
        const request = indexedDB.open("demo:confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const all = request.result
            .transaction("handoffs")
            .objectStore("handoffs")
            .getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
  );
  expect(Object.keys(stored[0]).sort()).toEqual([
    "createdAt",
    "delivery",
    "id",
    "passwordChannel",
    "recipient",
  ]);
  expect(JSON.stringify(stored)).not.toMatch(
    /sample-password-2026|project-update|meeting-notes/,
  );
});

test("@claim:access-phrase-excluded the access phrase is absent from storage and the handoff sheet", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#download-sheet").click();
  const sheet = await readFile(
    (await (await downloadPromise).path()) as string,
    "utf8",
  );
  expect(sheet).not.toContain("sample-password-2026");
  const stored = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("demo:confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const all = request.result
            .transaction("handoffs")
            .objectStore("handoffs")
            .getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
  );
  expect(JSON.stringify(stored)).not.toContain("sample-password-2026");
});

test("@claim:local-log-import an exported handoff log imports into a clean demo database", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const exportPromise = page.waitForEvent("download");
  await page.locator("#export-records").click();
  const exportPath = (await (await exportPromise).path()) as string;
  await page.locator("#reset-demo").click();
  await page.locator("#import-records").setInputFiles(exportPath);
  await expect(page.locator("#status")).toContainText("1 handoff was imported");
  await expect(page.locator("#record-list")).toContainText("Maya");
});

test("@claim:local-log-delete deletes a handoff-log entry after reload", async ({
  page,
}) => {
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  await expect(page.locator("#record-list")).toContainText("Maya");
  await page.reload();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete log entry" }).click();
  await expect(page.locator("#record-list")).toContainText(
    "No handoffs logged yet",
  );
  const records = await page.evaluate(
    async () =>
      new Promise<unknown[]>((resolve, reject) => {
        const request = indexedDB.open("demo:confidential-file-handoff", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const all = request.result
            .transaction("handoffs")
            .objectStore("handoffs")
            .getAll();
          all.onsuccess = () => resolve(all.result);
          all.onerror = () => reject(all.error);
        };
      }),
  );
  expect(records).toEqual([]);
});

test("@claim:site-storage-clear clearing browser site data removes records and license state", async ({
  browser,
}) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/api/license/verify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ valid: true, reason: "ok", expires_at: null }),
    }),
  );
  await page.goto("/?license=stored-license-token");
  await expect(page.locator("#license-status")).toContainText("unlocked");
  await preparePacket(page);
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  expect(
    (await page.evaluate(() => indexedDB.databases())).map(({ name }) => name).sort(),
  ).toEqual(["confidential-file-handoff", "demo:confidential-file-handoff"]);
  expect(
    await page.evaluate(() => localStorage.getItem("sb_license_verdict:confidential-file-handoff")),
  ).not.toBeNull();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Storage.clearDataForOrigin", {
    origin: "http://127.0.0.1:4173",
    storageTypes: "all",
  });
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => indexedDB.databases())).toEqual([]);
  await context.close();
});

test("@claim:no-sensitive-uploads the complete demo flow makes no off-origin request", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  const zipPromise = page.waitForEvent("download");
  await page.locator("#download-zip").click();
  await zipPromise;
  const sheetPromise = page.waitForEvent("download");
  await page.locator("#download-sheet").click();
  await sheetPromise;
  await page.locator("#reset-demo").click();
  expect(requests.length).toBeGreaterThan(0);
  expect(
    requests.every((url) => {
      const parsed = new URL(url);
      return (
        parsed.protocol === "blob:" || parsed.origin === "http://127.0.0.1:4173"
      );
    }),
  ).toBe(true);
});

test("@claim:free-core-tools ZIP, sheet, log, and export work without a license", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("sb_license:confidential-file-handoff"),
    ),
  ).toBeNull();
  await preparePacket(page);
  await expect(page.locator("#download-zip")).toBeEnabled();
  await expect(page.locator("#download-sheet")).toBeEnabled();
  await expect(page.locator("#export-records")).toBeEnabled();
  await expect(page.locator("#record-list")).toContainText("Maya");
});

test("@claim:pro-price the page states the US $9 one-time price beside its checkout", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Buy Pro once — US $9" }),
  ).toHaveAttribute(
    "href",
    "https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout",
  );
  await expect(page.locator(".pro")).toContainText("Pro costs US $9 once");
});

test("@claim:payment-provider-boundary payment stays on the hosted Sociobot checkout", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator("iframe")).toHaveCount(0);
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((elements) =>
      elements.map((element) => (element as HTMLScriptElement).src),
    );
  expect(
    scripts.every((url) => new URL(url).origin === "http://127.0.0.1:4173"),
  ).toBe(true);
  const response = await request.get(
    "https://api.sociobot.in/api/v1/products/confidential-file-handoff/checkout",
  );
  expect(response.ok()).toBe(true);
  expect(new URL(response.url()).hostname).toBe("checkout.dodopayments.com");
});

test("@claim:revoked-license-lock a revoked license turns off the personal-note field", async ({
  page,
}) => {
  await page.route("**/api/license/verify", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        valid: false,
        reason: "revoked",
        expires_at: null,
      }),
    }),
  );
  await page.goto("/?license=revoked-qa-token");
  await expect(page.locator("#license-status")).toContainText(
    "License no longer active",
  );
  await expect(page.locator("#custom-note")).toBeDisabled();
});

test("@claim:no-third-party-runtime core use loads no third-party scripts, fonts, analytics, or icons", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/?demo=1");
  await page.locator("#create-demo").click();
  expect(
    requests.every((url) => new URL(url).origin === "http://127.0.0.1:4173"),
  ).toBe(true);
  await expect(
    page.locator(
      'link[href*="fonts"], script[src*="analytics"], script[src*="googletag"]',
    ),
  ).toHaveCount(0);
});

test("@claim:artwork-provenance the shipped artwork has its original prompt record and exact social crop", async () => {
  const provenance = JSON.parse(
    await readFile("assets/src/print-desk.png.json", "utf8"),
  ) as { prompt: string; deployment: string };
  expect(provenance.deployment).toBe("factory-image");
  expect(provenance.prompt).toContain("confidential document handoff desk");
  const preview = await readFile("public/social-preview.png");
  expect(preview.readUInt32BE(16)).toBe(1200);
  expect(preview.readUInt32BE(20)).toBe(630);
});

test("landing first screen shows the action and all three facts at 1366 by 768", async ({
  browser,
}) => {
  const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  const page = await context.newPage();
  await page.goto("/");
  for (const selector of ["#page-title", ".lede", ".hero-actions", ".hero-facts"]) {
    const box = await page.locator(selector).boundingBox();
    expect(box, selector).not.toBeNull();
    expect(box!.y + box!.height, selector).toBeLessThanOrEqual(768);
  }
  await context.close();
});

test("routes have exact titles, complete metadata, a shared shell, and a real 404", async ({
  page,
}) => {
  const expectedNavigation = ["Demo", "How it works", "Handoff log", "Privacy"];
  const routes = [
    ["/", "Confidential File Handoff — create a protected ZIP"],
    ["/?demo=1", "Demo — Confidential File Handoff"],
    ["/privacy/", "Privacy — Confidential File Handoff"],
    ["/terms/", "Terms — Confidential File Handoff"],
    ["/offline.html", "Offline — Confidential File Handoff"],
  ] as const;
  for (const [route, title] of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /social-preview\.png$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('link[rel="icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
    await expect(page.locator("header .brand")).toContainText("Confidential");
    await expect(page.locator("footer")).toContainText(
      "Built by Param Factory",
    );
    await expect(page.locator("footer")).toContainText(/build [a-f0-9]{7}/);
    expect(await page.locator("header nav a").allTextContents()).toEqual(
      expectedNavigation,
    );
    await expect(page.locator("h1")).toHaveCount(1);
  }
  await page.goto("/404.html");
  await expect(page).toHaveTitle("Page not found — Confidential File Handoff");
  await expect(page.locator("header .brand")).toBeVisible();
  await expect(page.locator("footer")).toBeVisible();
  await expect(page.locator("footer")).toContainText(/build [a-f0-9]{7}/);
  expect(await page.locator("header nav a").allTextContents()).toEqual(
    expectedNavigation,
  );
  const deployConfig = JSON.parse(
    await readFile("public/staticwebapp.config.json", "utf8"),
  ) as {
    responseOverrides: { "404": { rewrite: string; statusCode: number } };
  };
  expect(deployConfig.responseOverrides["404"]).toEqual({
    rewrite: "/404.html",
    statusCode: 404,
  });
});

test("internal navigation and browser Back move focus to and announce the route heading", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("#route-status")).toHaveText(
    "Privacy — Confidential File Handoff",
  );
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("#route-status")).toHaveText(
    "Confidential File Handoff — create a protected ZIP",
  );
  await page.goto("/privacy/");
  await page.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL("/#how-it-works");
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("#route-status")).toHaveText(
    "Confidential File Handoff — create a protected ZIP",
  );
  await page.goto("/offline.html");
  await page.getByRole("link", { name: "Privacy" }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("#route-status")).toHaveText(
    "Privacy — Confidential File Handoff",
  );
});

test("shared route headers keep the same order without mobile overflow", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const expectedNavigation = ["Demo", "How it works", "Handoff log", "Privacy"];
  for (const route of ["/", "/?demo=1", "/privacy/", "/terms/", "/offline.html", "/404.html"]) {
    await page.goto(route);
    expect(await page.locator("header nav a").allTextContents()).toEqual(
      expectedNavigation,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      route,
    ).toBe(true);
  }
  await context.close();
});

test("legal and not-found routes have no serious accessibility violations", async ({
  page,
}) => {
  for (const route of ["/privacy/", "/terms/", "/offline.html", "/404.html"]) {
    await page.goto(route);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(async () =>
      (
        await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
        })
      ).violations.filter(({ impact }) =>
        ["serious", "critical"].includes(impact || ""),
      ),
    );
    expect(violations, route).toEqual([]);
  }
});

test("every non-download link resolves", async ({ page, request }) => {
  const seeds = ["/", "/?demo=1", "/privacy/", "/terms/", "/offline.html", "/404.html"];
  const links = new Set<string>();
  for (const seed of seeds) {
    await page.goto(seed);
    for (const href of await page
      .locator("a[href]")
      .evaluateAll((elements) =>
        elements.map((element) => (element as HTMLAnchorElement).href),
      ))
      links.add(href);
  }
  for (const href of links) {
    const url = new URL(href);
    if (url.hash) url.hash = "";
    const response = await request.get(url.toString());
    expect(response.status(), url.toString()).toBeLessThan(400);
  }
});

test("invalid submit focuses the first associated field and announces its correction", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#files").setInputFiles({
    name: "sample.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("sample"),
  });
  await page.locator("#prepare").click();
  await expect(page.locator("#status")).toContainText("Fix the marked fields");
  await expect(page.locator("#recipient")).toBeFocused();
  await expect(page.locator("#recipient")).toHaveAttribute(
    "aria-describedby",
    "recipient-error",
  );
  await expect(page.locator("#password-saved")).toHaveAttribute(
    "aria-describedby",
    "saved-error",
  );
});

test("mobile keyboard focus and touch targets are visible and accessible in both themes", async ({
  browser,
}) => {
  for (const colorScheme of ["light", "dark"] as const) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      colorScheme,
    });
    const page = await context.newPage();
    await page.goto("/");
    await page.locator("#files").focus();
    const outline = await page
      .locator(".file-picker")
      .evaluate((element) => getComputedStyle(element).outlineStyle);
    expect(outline).not.toBe("none");
    const tooSmall = await page
      .locator(
        ".site-header a:visible, footer a:visible, #recipient, #license-input",
      )
      .evaluateAll((elements) =>
        elements
          .map((element) => ({
            label: element.textContent || element.getAttribute("id"),
            width: element.getBoundingClientRect().width,
            height: element.getBoundingClientRect().height,
          }))
          .filter(({ width, height }) => width < 44 || height < 44),
      );
    expect(tooSmall).toEqual([]);
    await page.addScriptTag({ content: axe.source });
    const violations = await page.evaluate(
      async () => (await window.axe.run(document)).violations,
    );
    expect(violations).toEqual([]);
    await context.close();
  }
});

test("installed app serves the real privacy page offline and precaches hashed assets", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  const worker = await (await page.request.get("/sw.js")).text();
  expect(worker).toMatch(/confidential-handoff-[a-f0-9]{16}/);
  expect(worker).toMatch(/\/assets\/[A-Za-z0-9_-]+\.js/);
  await context.setOffline(true);
  await page.goto("/privacy/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy" }),
  ).toBeVisible();
  await context.setOffline(false);
});

declare global {
  interface Window {
    axe: typeof axe;
  }
}
