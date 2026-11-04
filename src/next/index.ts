import { revalidateTag } from "next/cache"
import { cookies, draftMode } from "next/headers"
import { SIGNATURE_HEADER, verify } from "../hmac"
import { contactSchema, type FormResult } from "../forms"

/**
 * POST /api/contact on the site. Forwards to the panel with the site's server-side
 * token, so the browser never sees it. The visitor IP goes along for rate limiting
 * and is hashed by the panel.
 */
export function createContactHandler(options: { apiUrl?: string; token?: string }) {
  return async function POST(request: Request): Promise<Response> {
    const reply = (result: FormResult, status: number) => Response.json(result, { status })
    if (!options.apiUrl || !options.token) return reply({ ok: false, error: "unavailable" }, 503)
    const body = await request.json().catch(() => null)
    const parsed = contactSchema.safeParse(body)
    if (!parsed.success) return reply({ ok: false, error: "invalid" }, 400)
    // Bots that fill the honeypot get a fake success and nothing is stored.
    if (parsed.data.website) return reply({ ok: true }, 200)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? ""
    const res = await fetch(`${options.apiUrl.replace(/\/$/, "")}/api/forms/v1/submit`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${options.token}`, "x-vs-client-ip": ip },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => null)
    if (!res) return reply({ ok: false, error: "unavailable" }, 503)
    return reply((await res.json().catch(() => ({ ok: false, error: "unavailable" }))) as FormResult, res.status)
  }
}

export const SITE_TAG = "vs:site"
export const PREVIEW_COOKIE = "vs_preview"

/**
 * POST /api/revalidate. The panel calls it after every publish, signed with the
 * site's REVALIDATE_SECRET. Stale content is never served after it returns.
 */
export function createRevalidateHandler(secret: string | undefined) {
  return async function POST(request: Request): Promise<Response> {
    const body = await request.text()
    if (!secret || !verify(secret, body, request.headers.get(SIGNATURE_HEADER))) {
      return new Response("unauthorized", { status: 401 })
    }
    revalidateTag(SITE_TAG, { expire: 0 })
    return Response.json({ revalidated: true })
  }
}

/**
 * GET /api/preview?token=…&path=/… from the panel's preview link. The token is
 * checked by the panel on every content request, so a forged one shows nothing.
 */
export async function handlePreview(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const token = url.searchParams.get("token")
  const path = url.searchParams.get("path") ?? "/"
  // Only same-site paths: no open redirect through the preview link.
  if (!token || !/^\/(?!\/)[\w\-./]*$/.test(path)) return new Response("bad request", { status: 400 })

  ;(await draftMode()).enable()
  ;(await cookies()).set(PREVIEW_COOKIE, token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 7 * 24 * 3600 })
  return Response.redirect(new URL(path, url.origin), 307)
}

/** GET /api/preview/exit */
export async function handlePreviewExit(request: Request): Promise<Response> {
  ;(await draftMode()).disable()
  ;(await cookies()).delete(PREVIEW_COOKIE)
  return Response.redirect(new URL("/", request.url), 307)
}

/** Preview token while draft mode is on, otherwise null. */
export async function currentPreviewToken(): Promise<string | null> {
  if (!(await draftMode()).isEnabled) return null
  return (await cookies()).get(PREVIEW_COOKIE)?.value ?? null
}
