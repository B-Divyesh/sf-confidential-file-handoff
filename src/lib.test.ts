import { describe, expect, it } from 'vitest';
import { makePassword, recipientSheet, validRecord } from './lib';

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
    expect(sheet).toContain('Do not expect it in the same message as the ZIP');
  });

  it('only accepts safe minimal records for import', () => {
    expect(validRecord({ id: 'a', recipient: 'Maya', createdAt: '2026-01-01', delivery: 'Email', passwordChannel: 'Text' })).toBe(true);
    expect(validRecord({ id: 'a', recipient: 'Maya' })).toBe(false);
  });
});
