'use strict';

const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const verify = require('./index.cjs');

const originalFetch = global.fetch;
afterEach(() => {
  verify._resetForTests();
  global.fetch = originalFetch;
});

test('allows 20 verification requests, then returns 429 with Retry-After', async () => {
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
});

test('rejects a missing token without calling the upstream API', async () => {
  let called = false;
  global.fetch = async () => { called = true; throw new Error('unexpected'); };
  const response = await verify({ log: { warn() {} } }, { headers: {}, query: {} });
  assert.equal(response.status, 400);
  assert.equal(called, false);
});
