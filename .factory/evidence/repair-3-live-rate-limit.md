# Live license-rate-limit boundary — 2026-08-28 UTC

Endpoint: `https://confidential-file-handoff.sociobot.in/api/license/verify?license=repair-final-three-boundary-token`

One browser identity sent 21 sequential requests in one minute. Requests 1 through 20 returned HTTP `200`. Request 21 returned:

```text
HTTP/2 429
cache-control: no-store
retry-after: 53
x-ratelimit-limit: 20
x-ratelimit-remaining: 0

{"valid":false,"reason":"rate_limited","expires_at":null}
```
