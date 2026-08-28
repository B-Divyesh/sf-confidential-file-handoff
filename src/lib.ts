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
  return `CONFIDENTIAL FILE HANDOFF\n\nHello ${recipient},\n\nYour sender has prepared ${details.fileCount} confidential ${fileWord} for you. The files are inside an encrypted ZIP folder.\n\n1. Receive or download the file named confidential-handoff.zip using: ${details.delivery}.\n2. Save it somewhere you can find again, such as Downloads.\n3. Open the ZIP file. It will ask for a password.\n4. The password will arrive separately by ${details.passwordChannel}. Do not expect it in the same message as the ZIP.\n5. After opening the files, reply to your sender: “I opened the files.”\n${note}\nIf the ZIP does not open, tell your sender what device you are using. Do not send the password back in the same message as the ZIP.\n\nWhat this does: the ZIP needs its separate password before its contents can be opened.\nWhat this does not do: verify who is receiving it, protect a device after it is opened, or guarantee the safety of the delivery channel.\n`;
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

const DB_NAME = 'confidential-file-handoff';
const STORE_NAME = 'handoffs';

export class HandoffStore {
  private db?: IDBDatabase;

  async ready(): Promise<void> {
    if (this.db) return;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onerror = () => reject(request.error);
    });
  }

  async all(): Promise<HandoffRecord[]> {
    await this.ready();
    return new Promise((resolve, reject) => {
      const request = this.db!.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
      request.onsuccess = () => resolve((request.result as HandoffRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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

  async replace(records: HandoffRecord[]): Promise<void> {
    await this.ready();
    await Promise.all(records.filter(validRecord).map((record) => this.put(record)));
  }
}

export function validRecord(value: unknown): value is HandoffRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.recipient === 'string' && typeof item.createdAt === 'string' && typeof item.delivery === 'string' && typeof item.passwordChannel === 'string';
}
