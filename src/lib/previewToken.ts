// Signed preview-session token.
//
// The `__sanity_preview` cookie used to be the constant string "true". Any
// visitor could forge it (DevTools, curl -b '__sanity_preview=true', a
// browser extension) and the middleware would route them through the
// drafts-perspective Sanity client — exposing unpublished content and, via
// stega, the Studio URL + document IDs. The httpOnly/secure flags don't
// help: they govern JS reads and cross-site sending, not whether a client
// can SET the value.
//
// Now the cookie carries `${expiry}.${hmac}` signed with a server-only key,
// so the middleware can prove the cookie was minted by /api/preview after a
// valid Sanity preview-secret handshake — not hand-typed by a visitor.
//
// Key: SANITY_API_READ_TOKEN. It's already required everywhere preview
// works (the preview client can't fetch drafts without it), so reusing it
// as the HMAC key guarantees the signing key is present in exactly the
// environments where preview is functional — no new secret to provision
// across the client fleet or local .env. It never leaves the server.

// Matches the cookie maxAge set in /api/preview (1 hour).
const PREVIEW_TTL_MS = 60 * 60 * 1000

async function hmacHex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Constant-time compare over equal-length hex strings (both are SHA-256 =
// 64 hex chars). Avoids leaking match progress via early return timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// Mint a fresh signed token. Called by /api/preview after the Sanity
// preview-secret validates.
export async function mintPreviewToken(key: string): Promise<string> {
  const expiry = Date.now() + PREVIEW_TTL_MS
  const sig = await hmacHex(String(expiry), key)
  return `${expiry}.${sig}`
}

// Verify a cookie value. Returns true only for a well-formed, unexpired,
// correctly-signed token. Any malformed/forged/old-format value (including
// the legacy constant "true") returns false.
export async function verifyPreviewToken(
  token: string | undefined | null,
  key: string | undefined | null,
): Promise<boolean> {
  if (!token || !key) return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const expiryStr = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  const expiry = Number(expiryStr)
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false
  const expected = await hmacHex(expiryStr, key)
  return timingSafeEqual(sig, expected)
}
