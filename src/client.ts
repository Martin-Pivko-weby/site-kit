import type { GlobalContent } from "./schema/blocks"
import type { PageData } from "./schema/registry"

// Talks to the panel's Content API. Server-side only: the read token must never
// reach the browser. Caching is the site's job ("use cache" + cacheTag), see
// site-template/src/lib/content.ts.

export type AssetRef = { id: string; url: string; width: number | null; height: number | null; alt: Record<string, string> }

export type SiteInfo = {
  slug: string
  name: string
  locales: string[]
  defaultLocale: string
  domain: string | null
  /** Author credit in the footer is a licence condition; false only with a written exception (contract art. 7.5). */
  footerCredit: boolean
  /** Paused for non-payment (VOP čl. 13): the site shows a maintenance page. */
  paused: boolean
}

export type ContentDocument = {
  id: string
  key: string
  path: Record<string, string>
  data: PageData
  updatedAt: string
}

export type SitePayload = {
  site: SiteInfo
  global: GlobalContent | null
  documents: ContentDocument[]
  assets: Record<string, AssetRef>
}

export type ContentClientOptions = {
  apiUrl: string
  token: string
  /** Signed preview token from the panel; returns drafts instead of published content. */
  previewToken?: string
}

export class ContentApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/** One request returns the whole published site; small sites make this the cheapest cache unit. */
export async function fetchSite({ apiUrl, token, previewToken }: ContentClientOptions): Promise<SitePayload> {
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/api/content/v1/site`, {
    headers: {
      authorization: `Bearer ${token}`,
      ...(previewToken ? { "x-vs-preview": previewToken } : {}),
    },
    cache: "no-store",
  })
  if (!response.ok) throw new ContentApiError(response.status, `content API ${response.status}`)
  return (await response.json()) as SitePayload
}

/** Finds the document whose path in `locale` matches. Paths are stored with a leading slash. */
export function findDocument(payload: SitePayload, locale: string, path: string): ContentDocument | undefined {
  const normalized = "/" + path.split("/").filter(Boolean).join("/")
  return payload.documents.find((d) => d.path[locale] === normalized)
}
