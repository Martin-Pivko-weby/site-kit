import type { Metadata } from "next"
import type { GlobalContent } from "./schema/blocks"
import type { AssetRef, ContentDocument, SitePayload } from "./client"
import { t } from "./i18n"

export function documentMetadata(payload: SitePayload, doc: ContentDocument, locale: string, siteUrl: string): Metadata {
  const { site } = payload
  const seo = doc.data.seo ?? {}
  const title = t(seo.title, locale, site.defaultLocale) ?? payload.global?.businessName ?? site.name
  const description = t(seo.description, locale, site.defaultLocale)
  const og: AssetRef | undefined = seo.ogImage ? payload.assets[seo.ogImage] : undefined
  const languages = Object.fromEntries(
    site.locales.filter((l) => doc.path[l]).map((l) => [l, new URL(localePath(site.defaultLocale, l, doc.path[l]), siteUrl).toString()]),
  )
  return {
    title,
    description,
    alternates: { canonical: languages[locale], languages },
    openGraph: { title, description, locale, images: og ? [{ url: og.url, width: og.width ?? undefined, height: og.height ?? undefined }] : undefined },
  }
}

/** The default locale lives at the root, others under /<locale>. */
export function localePath(defaultLocale: string, locale: string, path: string): string {
  return locale === defaultLocale ? path : `/${locale}${path === "/" ? "" : path}`
}

export function sitemapEntries(payload: SitePayload, siteUrl: string) {
  const { site } = payload
  return payload.documents.flatMap((doc) =>
    site.locales
      .filter((l) => doc.path[l])
      .map((l) => ({ url: new URL(localePath(site.defaultLocale, l, doc.path[l]), siteUrl).toString(), lastModified: doc.updatedAt })),
  )
}

export type BusinessType = "LocalBusiness" | "Restaurant" | "LodgingBusiness" | "HomeAndConstructionBusiness"

const DAY_NAMES = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" }

export function businessJsonLd(global: GlobalContent, type: BusinessType, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name: global.businessName,
    url: siteUrl,
    telephone: global.phone,
    email: global.email,
    address: global.address && {
      "@type": "PostalAddress",
      streetAddress: global.address.street,
      addressLocality: global.address.city,
      postalCode: global.address.zip,
      addressCountry: "SK",
    },
    openingHoursSpecification: global.hours
      .filter((h) => !h.closed && h.open && h.close)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: DAY_NAMES[h.day], opens: h.open, closes: h.close })),
    sameAs: global.socials.map((s) => s.url),
  }
}
