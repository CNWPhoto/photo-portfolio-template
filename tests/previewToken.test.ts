import { describe, it, expect } from 'vitest'
import { mintPreviewToken, verifyPreviewToken } from '../src/lib/previewToken'

// Security-critical: this is the gate that decides whether a request sees
// unpublished drafts. The legacy bug was that the cookie was the constant
// "true" — forgeable by anyone. These tests lock in that a forged or
// tampered cookie is rejected and only a server-minted token passes.

const KEY = 'sk-test-read-token-abc123'

// Mirror the implementation's HMAC so we can forge edge-case tokens
// (e.g. correctly-signed-but-expired) the public mint API can't produce.
async function hmacHex(message: string, key: string): Promise<string> {
  const enc = new TextEncoder()
  const k = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

describe('previewToken', () => {
  it('a freshly minted token verifies', async () => {
    const token = await mintPreviewToken(KEY)
    expect(await verifyPreviewToken(token, KEY)).toBe(true)
  })

  it('rejects the legacy constant "true" (the original forgery)', async () => {
    expect(await verifyPreviewToken('true', KEY)).toBe(false)
  })

  it('rejects a token signed with a different key', async () => {
    const token = await mintPreviewToken(KEY)
    expect(await verifyPreviewToken(token, 'some-other-key')).toBe(false)
  })

  it('rejects a tampered signature', async () => {
    const token = await mintPreviewToken(KEY)
    const flipped = token.slice(0, -1) + (token.endsWith('0') ? '1' : '0')
    expect(await verifyPreviewToken(flipped, KEY)).toBe(false)
  })

  it('rejects a tampered expiry (sig no longer matches)', async () => {
    const token = await mintPreviewToken(KEY)
    const sig = token.split('.')[1]
    const farFuture = `${Date.now() + 999_999_999}.${sig}`
    expect(await verifyPreviewToken(farFuture, KEY)).toBe(false)
  })

  it('rejects a correctly-signed but EXPIRED token', async () => {
    const past = Date.now() - 1000
    const expired = `${past}.${await hmacHex(String(past), KEY)}`
    // signature is valid, only the expiry check should fail
    expect(await verifyPreviewToken(expired, KEY)).toBe(false)
  })

  it('rejects malformed values (no dot, empty, undefined, null)', async () => {
    expect(await verifyPreviewToken('nodothere', KEY)).toBe(false)
    expect(await verifyPreviewToken('', KEY)).toBe(false)
    expect(await verifyPreviewToken(undefined, KEY)).toBe(false)
    expect(await verifyPreviewToken(null, KEY)).toBe(false)
    expect(await verifyPreviewToken('.onlysig', KEY)).toBe(false)
  })

  it('rejects when no signing key is available (fail closed)', async () => {
    const token = await mintPreviewToken(KEY)
    expect(await verifyPreviewToken(token, undefined)).toBe(false)
    expect(await verifyPreviewToken(token, '')).toBe(false)
  })
})
