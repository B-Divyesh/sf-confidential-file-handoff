'use strict';

const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const verify = require('./index.cjs');

function storageError(statusCode) { const error = new Error(`storage ${statusCode}`); error.statusCode = statusCode; return error; }

class SharedTableClient {
  constructor() { this.rows = new Map(); this.revision = 0; }
  async createTable() {}
  async getEntity(_partitionKey, rowKey) {
    const row = this.rows.get(rowKey);
    if (!row) throw storageError(404);
    return { ...row };
  }
  async createEntity(entity) {
    if (this.rows.has(entity.rowKey)) throw storageError(409);
    this.rows.set(entity.rowKey, { ...entity, etag: String(++this.revision) });
  }
  async updateEntity(entity, _mode, { etag }) {
    const row = this.rows.get(entity.rowKey);
    if (!row || row.etag !== etag) throw storageError(412);
    this.rows.set(entity.rowKey, { ...entity, etag: String(++this.revision) });
  }
  async *listEntities() {}
  async deleteEntity() {}
}

const originalFetch = global.fetch;
afterEach(() => {
  verify._setRateLimiterForTests(undefined);
  global.fetch = originalFetch;
});

test('@claim:license-rate-limit allows 20 verification requests, then returns 429 with Retry-After', async () => {
  // Alternate calls between two rate-limiter instances to reproduce a scaled
  // managed function. Their shared table must still reject request 21.
  const table = new SharedTableClient();
  const firstInstance = new verify._AzureTableRateLimiterForTests('', table);
  const secondInstance = new verify._AzureTableRateLimiterForTests('', table);
  let calls = 0;
  verify._setRateLimiterForTests({ take: (key) => (++calls % 2 ? firstInstance : secondInstance).take(key) });
  global.fetch = async () => new Response(JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }), { status: 200 });
  const context = { log: { warn() {} } };
  const req = { headers: { 'x-forwarded-for': '203.0.113.8' }, query: { license: 'invalid-test-token' } };
  const responses = [];
  for (let index = 0; index < 21; index += 1) responses.push(await verify(context, req));
  assert.deepEqual(responses.slice(0, 20).map(({ status }) => status), Array(20).fill(200));
  assert.equal(responses[20].status, 429);
  assert.match(responses[20].headers['Retry-After'], /^\d+$/);
  assert.equal(responses[20].headers['Cache-Control'], 'no-store');
  assert.equal(responses[20].headers['X-RateLimit-Limit'], '20');
  assert.equal(responses[20].headers['X-RateLimit-Remaining'], '0');
});

test('rejects a missing token without calling the upstream API', async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  let called = false;
  global.fetch = async () => { called = true; throw new Error('unexpected'); };
  const response = await verify({ log: { warn() {} } }, { headers: {}, query: {} });
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test('uses a stable browser identity instead of a rotating edge address', async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  global.fetch = async () => new Response(JSON.stringify({ valid: false, reason: 'invalid', expires_at: null }), { status: 200 });
  const context = { log: { warn() {} } };
  const first = await verify(context, { headers: { 'x-forwarded-for': 'edge-a, client-a', 'user-agent': 'qa-browser', 'accept-language': 'en' }, query: { license: 'test-token-a' } });
  const second = await verify(context, { headers: { 'x-forwarded-for': 'edge-b, client-a', 'user-agent': 'qa-browser', 'accept-language': 'en' }, query: { license: 'test-token-b' } });
  assert.equal(first.headers['X-RateLimit-Remaining'], '19');
  assert.equal(second.headers['X-RateLimit-Remaining'], '18');
});

test('fails closed when durable rate-limit storage is unavailable', async () => {
  const originalStorage = process.env.AzureWebJobsStorage;
  const originalRateStorage = process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING;
  delete process.env.AzureWebJobsStorage;
  delete process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING;
  try {
    const response = await verify({ log: { warn() {} } }, { headers: {}, query: { license: 'test-token' } });
    assert.equal(response.status, 503);
    assert.equal(response.headers['Retry-After'], '60');
  } finally {
    if (originalStorage === undefined) delete process.env.AzureWebJobsStorage; else process.env.AzureWebJobsStorage = originalStorage;
    if (originalRateStorage === undefined) delete process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING; else process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING = originalRateStorage;
  }
});
