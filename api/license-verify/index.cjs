'use strict';

const { createHash } = require('node:crypto');

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const PRODUCT = 'confidential-file-handoff';
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT}/verify`;
const TABLE_NAME = 'LicenseRateLimits';
const PARTITION_KEY = 'license-verify';
let TableClient;

function tableClient() {
  if (!TableClient) ({ TableClient } = require('@azure/data-tables'));
  return TableClient;
}

function result(count, resetAt, now) {
  return { allowed: count <= MAX_REQUESTS, remaining: Math.max(0, MAX_REQUESTS - count), retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1_000)) };
}

/** A compact counter used only when the managed host cannot load the optional Table SDK. */
function createMemoryRateLimiter() {
  const windows = new Map();
  return {
    async take(key, now = Date.now()) {
      let window = windows.get(key);
      if (!window || window.resetAt <= now) { window = { count: 0, resetAt: now + WINDOW_MS }; windows.set(key, window); }
      window.count += 1;
      return result(window.count, window.resetAt, now);
    },
    clear() { windows.clear(); }
  };
}

function status(error) { return Number(error?.statusCode ?? error?.status ?? 0); }
function isMissing(error) { return status(error) === 404; }
function isConflict(error) { return status(error) === 409 || status(error) === 412; }
function warn(context, message) { context.log?.warn?.(message); }

/**
 * Azure Table Storage is shared by every managed-function instance. Updates use
 * entity ETags, so concurrent instances cannot each admit request 21. Rows hold
 * only a one-way browser-identity digest, a count, and a one-minute expiry.
 */
class AzureTableRateLimiter {
  constructor(connectionString, client) {
    this.client = client || tableClient().fromConnectionString(connectionString, TABLE_NAME);
    this.ready = this.client.createTable();
    this.lastCleanup = 0;
  }

  rowKey(client) { return createHash('sha256').update(client).digest('hex'); }

  async cleanupExpired(now) {
    if (now - this.lastCleanup < WINDOW_MS) return;
    this.lastCleanup = now;
    const expired = [];
    // Azure Tables parses 13-digit epoch values as Int64 only when the OData
    // literal carries the suffix; without it cleanup makes every request fail.
    const entities = this.client.listEntities({ queryOptions: { filter: `PartitionKey eq '${PARTITION_KEY}' and resetAt lt ${now}L` } });
    for await (const entity of entities) { expired.push(entity); if (expired.length >= 100) break; }
    await Promise.all(expired.map((entity) => this.client.deleteEntity(PARTITION_KEY, entity.rowKey, { etag: entity.etag }).catch(() => undefined)));
  }

  async take(client, now = Date.now()) {
    await this.ready;
    await this.cleanupExpired(now);
    const rowKey = this.rowKey(client);
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        const entity = await this.client.getEntity(PARTITION_KEY, rowKey);
        const resetAt = Number(entity.resetAt);
        const count = resetAt > now ? Number(entity.count) + 1 : 1;
        const nextResetAt = resetAt > now ? resetAt : now + WINDOW_MS;
        await this.client.updateEntity({ partitionKey: PARTITION_KEY, rowKey, count, resetAt: nextResetAt }, 'Replace', { etag: entity.etag });
        return result(count, nextResetAt, now);
      } catch (error) {
        if (!isMissing(error)) { if (isConflict(error)) continue; throw error; }
        try {
          const resetAt = now + WINDOW_MS;
          await this.client.createEntity({ partitionKey: PARTITION_KEY, rowKey, count: 1, resetAt });
          return result(1, resetAt, now);
        } catch (createError) {
          if (isConflict(createError)) continue;
          throw createError;
        }
      }
    }
    throw new Error('Rate limit update conflicted too many times.');
  }
}

let rateLimiter;
function getRateLimiter() {
  if (rateLimiter) return rateLimiter;
  const connectionString = process.env.RATE_LIMIT_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage;
  if (!connectionString) throw new Error('No durable Azure Table Storage connection is configured for license rate limiting.');
  try {
    rateLimiter = new AzureTableRateLimiter(connectionString);
  } catch (error) {
    // Static Web Apps can load a deployed function before resolving optional
    // package files. Keep the public allowance available during that host
    // condition rather than turning every license check into an empty 500.
    if (error?.code !== 'MODULE_NOT_FOUND') throw error;
    rateLimiter = createMemoryRateLimiter();
  }
  return rateLimiter;
}

function clientKey(req) {
  const header = (name) => req.headers?.[name] || req.headers?.get?.(name) || '';
  const principal = header('x-ms-client-principal-id');
  // Static Web Apps may prepend a different edge address for each request and
  // does not always forward an origin address. An authenticated principal is
  // best; otherwise a browser-profile fingerprint is stable across those edge
  // hops without retaining the raw value (rowKey hashes it before storage).
  const browserProfile = ['user-agent', 'accept-language', 'sec-ch-ua', 'sec-ch-ua-mobile', 'sec-ch-ua-platform'].map(header).filter(Boolean).join('|');
  const platformClient = header('x-azure-clientip') || header('x-client-ip') || header('client-ip');
  const forwarded = String(header('x-forwarded-for')).split(',').map((value) => value.trim()).filter(Boolean);
  return String(principal).trim() || browserProfile || String(platformClient).trim() || forwarded.at(-1) || 'unknown-client';
}

module.exports = async function licenseVerify(context, req) {
  const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', 'X-RateLimit-Limit': String(MAX_REQUESTS) };
  let limit;
  try { limit = await getRateLimiter().take(clientKey(req)); }
  catch {
    warn(context, 'License verification rate-limit storage was unavailable.');
    return { status: 503, headers: { ...headers, 'Retry-After': '60' }, body: { valid: false, reason: 'unavailable', expires_at: null } };
  }
  const rateHeaders = { ...headers, 'X-RateLimit-Remaining': String(limit.remaining) };
  if (!limit.allowed) return { status: 429, headers: { ...rateHeaders, 'Retry-After': String(limit.retryAfter) }, body: { valid: false, reason: 'rate_limited', expires_at: null } };

  const license = String(req.query?.license ?? '').trim();
  if (!license || license.length > 2_048) return { status: 400, headers: rateHeaders, body: { valid: false, reason: 'invalid', expires_at: null } };

  try {
    const upstream = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(license)}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8_000) });
    const body = await upstream.json();
    return { status: upstream.status, headers: rateHeaders, body };
  } catch {
    warn(context, 'License verification upstream was unavailable.');
    return { status: 503, headers: { ...rateHeaders, 'Retry-After': '60' }, body: { valid: false, reason: 'unavailable', expires_at: null } };
  }
};

module.exports._createMemoryRateLimiterForTests = createMemoryRateLimiter;
module.exports._setRateLimiterForTests = (limiter) => { rateLimiter = limiter; };
module.exports._setTableClientForTests = (client) => { TableClient = client; };
module.exports._AzureTableRateLimiterForTests = AzureTableRateLimiter;
