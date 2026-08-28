"use strict";

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { afterEach, test } = require("node:test");
const verify = require("./index.cjs");

function storageError(statusCode) {
  const error = new Error(`storage ${statusCode}`);
  error.statusCode = statusCode;
  return error;
}

class SharedTableClient {
  constructor() {
    this.rows = new Map();
    this.revision = 0;
  }
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
  verify._setTableClientForTests(undefined);
  global.fetch = originalFetch;
});

test("@claim:license-rate-limit allows 20 verification requests, then returns 429 with Retry-After", async () => {
  // Alternate calls between two rate-limiter instances to reproduce a scaled
  // managed function. Their shared table must still reject request 21.
  const table = new SharedTableClient();
  const firstInstance = new verify._AzureTableRateLimiterForTests("", table);
  const secondInstance = new verify._AzureTableRateLimiterForTests("", table);
  let calls = 0;
  verify._setRateLimiterForTests({
    take: (key) => (++calls % 2 ? firstInstance : secondInstance).take(key),
  });
  global.fetch = async () =>
    new Response(
      JSON.stringify({ valid: false, reason: "invalid", expires_at: null }),
      { status: 200 },
    );
  const context = { log: { warn() {} } };
  const req = {
    headers: { "x-forwarded-for": "203.0.113.8" },
    query: { license: "invalid-test-token" },
  };
  const responses = [];
  for (let index = 0; index < 21; index += 1)
    responses.push(await verify(context, req));
  assert.deepEqual(
    responses.slice(0, 20).map(({ status }) => status),
    Array(20).fill(200),
  );
  assert.equal(responses[20].status, 429);
  assert.match(responses[20].headers["Retry-After"], /^\d+$/);
  assert.equal(responses[20].headers["Cache-Control"], "no-store");
  assert.equal(responses[20].headers["X-RateLimit-Limit"], "20");
  assert.equal(responses[20].headers["X-RateLimit-Remaining"], "0");
});

test("@claim:license-response-no-store license responses forbid caching", async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  global.fetch = async () =>
    new Response(
      JSON.stringify({ valid: true, reason: "ok", expires_at: null }),
      { status: 200 },
    );
  const response = await verify(
    { log: { warn() {} } },
    {
      headers: { "user-agent": "qa-browser" },
      query: { license: "valid-test-token" },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers["Cache-Control"], "no-store");
});

test("@claim:license-rate-storage-minimal the rate counter stores only a digest, count, and expiry", async () => {
  const table = new SharedTableClient();
  verify._setRateLimiterForTests(
    new verify._AzureTableRateLimiterForTests("", table),
  );
  global.fetch = async () =>
    new Response(
      JSON.stringify({ valid: false, reason: "invalid", expires_at: null }),
      { status: 200 },
    );
  await verify(
    { log: { warn() {} } },
    {
      headers: { "user-agent": "qa-browser", "accept-language": "en" },
      query: { license: "must-not-be-stored" },
    },
  );
  const [row] = [...table.rows.values()];
  assert.match(row.rowKey, /^[a-f0-9]{64}$/);
  assert.deepEqual(
    Object.keys(row).sort(),
    ["count", "etag", "partitionKey", "resetAt", "rowKey"].sort(),
  );
  assert.doesNotMatch(JSON.stringify(row), /qa-browser|must-not-be-stored/);
});

test("rejects a missing token without calling the upstream API", async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  let called = false;
  global.fetch = async () => {
    called = true;
    throw new Error("unexpected");
  };
  const response = await verify(
    { log: { warn() {} } },
    { headers: {}, query: {} },
  );
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("uses a stable browser identity instead of a rotating edge address", async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  global.fetch = async () =>
    new Response(
      JSON.stringify({ valid: false, reason: "invalid", expires_at: null }),
      { status: 200 },
    );
  const context = { log: { warn() {} } };
  const first = await verify(context, {
    headers: {
      "x-forwarded-for": "edge-a, client-a",
      "user-agent": "qa-browser",
      "accept-language": "en",
    },
    query: { license: "test-token-a" },
  });
  const second = await verify(context, {
    headers: {
      "x-forwarded-for": "edge-b, client-a",
      "user-agent": "qa-browser",
      "accept-language": "en",
    },
    query: { license: "test-token-b" },
  });
  assert.equal(first.headers["X-RateLimit-Remaining"], "19");
  assert.equal(second.headers["X-RateLimit-Remaining"], "18");
});

test("fails closed when durable rate-limit storage is unavailable", async () => {
  const originalStorage = process.env.AzureWebJobsStorage;
  const originalRateStorage = process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING;
  delete process.env.AzureWebJobsStorage;
  delete process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING;
  try {
    const response = await verify(
      { log: { warn() {} } },
      { headers: {}, query: { license: "test-token" } },
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers["Retry-After"], "60");
  } finally {
    if (originalStorage === undefined) delete process.env.AzureWebJobsStorage;
    else process.env.AzureWebJobsStorage = originalStorage;
    if (originalRateStorage === undefined)
      delete process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING;
    else process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING = originalRateStorage;
  }
});

test("@regression:managed-function log functions do not turn an upstream outage into HTTP 500", async () => {
  verify._setRateLimiterForTests(verify._createMemoryRateLimiterForTests());
  global.fetch = async () => {
    throw new Error("upstream unavailable");
  };
  const response = await verify(
    { log() {} },
    { headers: {}, query: { license: "test-token" } },
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers["Retry-After"], "60");
});

test("@regression:missing-optional-table-sdk still enforces 20 checks and returns 429", async () => {
  const missing = new Error("Cannot find module '@azure/data-tables'");
  missing.code = "MODULE_NOT_FOUND";
  verify._setTableClientForTests({
    fromConnectionString() {
      throw missing;
    },
  });
  const originalStorage = process.env.AzureWebJobsStorage;
  process.env.AzureWebJobsStorage = "configured-for-managed-host";
  global.fetch = async () =>
    new Response(
      JSON.stringify({ valid: false, reason: "invalid", expires_at: null }),
      { status: 200 },
    );
  try {
    const responses = [];
    for (let index = 0; index < 21; index += 1) {
      responses.push(
        await verify(
          { log() {} },
          {
            headers: { "user-agent": "qa-browser" },
            query: { license: "test-token" },
          },
        ),
      );
    }
    assert.deepEqual(
      responses.slice(0, 20).map(({ status }) => status),
      Array(20).fill(200),
    );
    assert.equal(responses[20].status, 429);
    assert.match(responses[20].headers["Retry-After"], /^\d+$/);
  } finally {
    if (originalStorage === undefined) delete process.env.AzureWebJobsStorage;
    else process.env.AzureWebJobsStorage = originalStorage;
  }
});

test("@regression:managed-function-runtime keeps the Azure Table dependency Node 18 compatible", () => {
  // Azure Static Web Apps runs this managed function on Node 18. A caret range
  // previously resolved Azure transitive packages requiring Node 22, which made
  // the function fail during module loading and returned an empty HTTP 500.
  const lock = JSON.parse(
    readFileSync(resolve(process.cwd(), "api", "package-lock.json"), "utf8"),
  );
  const runtimePackages = Object.entries(lock.packages).filter(
    ([path]) =>
      path.startsWith("node_modules/@azure/") ||
      path.startsWith("node_modules/@typespec/"),
  );
  assert.ok(
    runtimePackages.length > 1,
    "the API lock must pin the table client and its runtime dependencies",
  );
  for (const [path, manifest] of runtimePackages) {
    const range = manifest.engines?.node || "";
    assert.ok(
      !/>=2[0-9]/.test(range),
      `${path} requires an unsupported Node version: ${range}`,
    );
  }
});
