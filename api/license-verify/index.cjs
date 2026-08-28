'use strict';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const PRODUCT = 'confidential-file-handoff';
const VERIFY_URL = `https://api.sociobot.in/api/v1/products/${PRODUCT}/verify`;
const windows = new Map();

function clientKey(req) {
  const forwarded = req.headers?.['x-forwarded-for'] || req.headers?.get?.('x-forwarded-for') || '';
  return String(forwarded).split(',')[0].trim() || 'unknown-client';
}

function checkLimit(key, now = Date.now()) {
  if (windows.size > 2_000) {
    for (const [candidate, value] of windows) if (value.resetAt <= now) windows.delete(candidate);
  }
  let window = windows.get(key);
  if (!window || window.resetAt <= now) {
    window = { count: 0, resetAt: now + WINDOW_MS };
    windows.set(key, window);
  }
  window.count += 1;
  return { allowed: window.count <= MAX_REQUESTS, retryAfter: Math.max(1, Math.ceil((window.resetAt - now) / 1_000)) };
}

module.exports = async function licenseVerify(context, req) {
  const limit = checkLimit(clientKey(req));
  const headers = {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-RateLimit-Limit': String(MAX_REQUESTS)
  };
  if (!limit.allowed) {
    return {
      status: 429,
      headers: { ...headers, 'Retry-After': String(limit.retryAfter) },
      body: { valid: false, reason: 'rate_limited', expires_at: null }
    };
  }

  const license = String(req.query?.license ?? '').trim();
  if (!license || license.length > 2_048) {
    return { status: 400, headers, body: { valid: false, reason: 'invalid', expires_at: null } };
  }

  try {
    const upstream = await fetch(`${VERIFY_URL}?license=${encodeURIComponent(license)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8_000)
    });
    const body = await upstream.json();
    return { status: upstream.status, headers, body };
  } catch {
    context.log.warn('License verification upstream was unavailable.');
    return { status: 503, headers: { ...headers, 'Retry-After': '60' }, body: { valid: false, reason: 'unavailable', expires_at: null } };
  }
};

module.exports._resetForTests = () => windows.clear();
