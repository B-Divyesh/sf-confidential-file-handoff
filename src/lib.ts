export const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*+-';

export function makePassword(length = 18): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => PASSWORD_CHARS[value % PASSWORD_CHARS.length]).join('');
}

export interface SheetDetails {
  recipient: string;
  fileCount: number;
  delivery: string;
  passwordChannel: string;
  customNote?: string;
}

export function recipientSheet(details: SheetDetails): string {
  const fileWord = details.fileCount === 1 ? 'file' : 'files';
  const recipient = details.recipient.trim() || 'there';
  const note = details.customNote?.trim() ? `\nNote from your sender: ${details.customNote.trim()}\n` : '';
  return `CONFIDENTIAL FILE HANDOFF\n\nHello ${recipient},\n\nYour sender has prepared ${details.fileCount} confidential ${fileWord} for you. The files are inside an AES-256 encrypted ZIP folder.\n\n1. Receive or download the file named confidential-handoff.zip using: ${details.delivery}.\n2. Save it somewhere you can find again, such as Downloads.\n3. Open the ZIP file. It will ask for a password.\n4. The password will arrive separately by ${details.passwordChannel}. Do not expect it in the same message as the ZIP.\n5. After opening the files, reply to your sender: “I opened the files.”\n${note}\nIf your computer's built-in ZIP tool says the archive is unsupported, use an AES-256 ZIP-compatible extractor such as 7-Zip (Windows), Keka (macOS), or PeaZip (Windows, macOS, or Linux). If it still does not open, tell your sender what device and app you are using. Do not send the password back in the same message as the ZIP.\n\nWhat this does: the ZIP needs its separate password before its contents can be opened.\nWhat this does not do: hide file names shown by a ZIP listing, verify who is receiving it, protect a device after it is opened, or guarantee the safety of the delivery channel.\n`;
}

/** Give every ZIP entry a deterministic unique name without changing the source files. */
export function uniqueArchiveNames(files: Pick<File, 'name'>[]): string[] {
  const used = new Set<string>();
  return files.map(({ name }) => {
    const safeName = name || 'unnamed-file';
    if (!used.has(safeName)) {
      used.add(safeName);
      return safeName;
    }
    const dot = safeName.lastIndexOf('.');
    const hasExtension = dot > 0;
    const stem = hasExtension ? safeName.slice(0, dot) : safeName;
    const extension = hasExtension ? safeName.slice(dot) : '';
    let suffix = 2;
    let candidate = `${stem} (${suffix})${extension}`;
    while (used.has(candidate)) candidate = `${stem} (${++suffix})${extension}`;
    used.add(candidate);
    return candidate;
  });
}

export interface HandoffRecord {
  id: string;
  recipient: string;
  createdAt: string;
  delivery: string;
  passwordChannel: string;
  sentAt?: string;
  acknowledgedAt?: string;
}

const RECORD_KEYS = new Set(['id', 'recipient', 'createdAt', 'delivery', 'passwordChannel', 'sentAt', 'acknowledgedAt']);

function validDate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && Number.isFinite(Date.parse(value));
}

/** Parse an exported record and return a new allow-listed object. */
export function sanitizeRecord(value: unknown, rejectExtraFields = true): HandoffRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const item = value as Record<string, unknown>;
  if (rejectExtraFields && Object.keys(item).some((key) => !RECORD_KEYS.has(key))) return undefined;
  if (typeof item.id !== 'string' || !item.id || item.id.length > 128) return undefined;
  if (typeof item.recipient !== 'string' || !item.recipient.trim() || item.recipient.length > 80) return undefined;
  if (!validDate(item.createdAt)) return undefined;
  if (typeof item.delivery !== 'string' || !item.delivery || item.delivery.length > 120) return undefined;
  if (typeof item.passwordChannel !== 'string' || !item.passwordChannel || item.passwordChannel.length > 120) return undefined;
  if (item.sentAt !== undefined && !validDate(item.sentAt)) return undefined;
  if (item.acknowledgedAt !== undefined && !validDate(item.acknowledgedAt)) return undefined;
  return {
    id: item.id,
    recipient: item.recipient.trim(),
    createdAt: item.createdAt,
    delivery: item.delivery,
    passwordChannel: item.passwordChannel,
    ...(item.sentAt ? { sentAt: item.sentAt as string } : {}),
    ...(item.acknowledgedAt ? { acknowledgedAt: item.acknowledgedAt as string } : {})
  };
}

const DB_NAME = 'confidential-file-handoff';
const STORE_NAME = 'handoffs';

export class HandoffStore {
  private db?: IDBDatabase;
  constructor(private readonly databaseName = DB_NAME) {}

  async ready(): Promise<void> {
    if (this.db) return;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    });
  }

  async all(): Promise<HandoffRecord[]> {
    await this.ready();
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => {
        const raw = request.result as unknown[];
        const records = raw.map((value) => sanitizeRecord(value, false)).filter((value): value is HandoffRecord => Boolean(value));
        // Repair legacy rows that pre-date strict validation. This also removes any
        // secret-like extra properties imported by older versions of the app.
        if (raw.length) {
          const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
          const objectStore = transaction.objectStore(STORE_NAME);
          raw.forEach((value) => {
            const source = value as Record<string, unknown>;
            const clean = sanitizeRecord(value, false);
            if (clean) objectStore.put(clean);
            else if (typeof source?.id === 'string') objectStore.delete(source.id);
          });
        }
        resolve(records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async put(record: HandoffRecord): Promise<void> {
    await this.ready();
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(record);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(id: string): Promise<void> {
    await this.ready();
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    await this.ready();
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async replace(records: unknown[]): Promise<number> {
    await this.ready();
    const clean = records.map((record) => sanitizeRecord(record)).filter((record): record is HandoffRecord => Boolean(record));
    if (clean.length !== records.length) throw new Error('invalid record');
    await Promise.all(clean.map((record) => this.put(record)));
    return clean.length;
  }
}

export function validRecord(value: unknown): value is HandoffRecord {
  return Boolean(sanitizeRecord(value));
}
