import { describe, expect, it } from 'vitest';
import { makePassword, recipientSheet, sanitizeRecord, uniqueArchiveNames, validRecord } from './lib';

describe('handoff helpers', () => {
  it('makes a fresh password of the requested length', () => {
    const password = makePassword(24);
    expect(password).toHaveLength(24);
    expect(password).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*+-]+$/);
  });

  it('writes a clear two-channel recipient sheet', () => {
    const sheet = recipientSheet({ recipient: 'Maya', fileCount: 2, delivery: 'Email attachment', passwordChannel: 'Text message' });
    expect(sheet).toContain('Hello Maya');
    expect(sheet).toContain('Email attachment');
    expect(sheet).toContain('Text message');
    expect(sheet).toContain('shared-file-receipt.zip');
    expect(sheet).toContain('protected AES-256 ZIP');
    expect(sheet).toContain('ZIP access phrase will arrive separately');
    expect(sheet).toContain('Do not expect it in the same message as the ZIP');
    expect(sheet).toContain('AES-256 ZIP-compatible extractor');
    expect(sheet).toContain('does not do: hide file names');
    expect(sheet).not.toMatch(/\ban prepared ZIP folder\b|\ba access phrase\b|\ban ZIP extractor\b/i);
  });

  it('only accepts safe minimal records for import', () => {
    expect(validRecord({ id: 'a', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text' })).toBe(true);
    expect(validRecord({ id: 'a', recipient: 'Maya' })).toBe(false);
    expect(validRecord({ id: 'a', recipient: 'Maya', createdAt: 'not-a-date', delivery: 'Email', passwordChannel: 'Text' })).toBe(false);
    expect(validRecord({ id: 'a', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text', password: 'secret' })).toBe(false);
    expect(sanitizeRecord({ id: 'a', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text', password: 'secret' }, false)).toEqual({
      id: 'a', recipient: 'Maya', createdAt: '2026-01-01T00:00:00.000Z', delivery: 'Email', passwordChannel: 'Text'
    });
  });

  it('renames duplicate ZIP entries predictably', () => {
    expect(uniqueArchiveNames([{ name: 'scan.pdf' }, { name: 'scan.pdf' }, { name: 'scan (2).pdf' }, { name: 'notes' }, { name: 'notes' }] as File[]))
      .toEqual(['scan.pdf', 'scan (2).pdf', 'scan (2) (2).pdf', 'notes', 'notes (2)']);
  });
});
