import { createHmac, timingSafeEqual } from "node:crypto"

// Signed requests between the panel and a site (revalidation, schema upload).
// Header format: t=<unix ms>,v1=<hex sha256 hmac of "<t>.<body>">

export const SIGNATURE_HEADER = "x-vs-signature"
const TOLERANCE_MS = 5 * 60 * 1000

export function sign(secret: string, body: string, now = Date.now()): string {
  const mac = createHmac("sha256", secret).update(`${now}.${body}`).digest("hex")
  return `t=${now},v1=${mac}`
}

export function verify(secret: string, body: string, header: string | null, now = Date.now()): boolean {
  if (!header || !secret) return false
  const match = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(header)
  if (!match) return false
  const timestamp = Number(match[1])
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp) > TOLERANCE_MS) return false
  const expected = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest()
  const given = Buffer.from(match[2], "hex")
  return given.length === expected.length && timingSafeEqual(given, expected)
}
