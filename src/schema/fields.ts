import { z } from "zod"

// Field builders carry form hints in JSON Schema metadata, so the panel can
// render an editor from a schema it never saw at build time:
//   x-localized  value is { [locale]: inner }, one input per enabled locale
//   x-widget     text | textarea | markdown | image | url | time

export const LOCALE = /^[a-z]{2}$/

type Widget = "text" | "textarea" | "markdown" | "image" | "url" | "time"

export function localized<T extends z.ZodType>(inner: T, title: string, widget: Widget = "text") {
  return z.record(z.string().regex(LOCALE), inner).meta({ title, "x-localized": true, "x-widget": widget })
}

export const text = (title: string, max = 200) => localized(z.string().max(max), title, "text")
export const textarea = (title: string, max = 2000) => localized(z.string().max(max), title, "textarea")
export const markdown = (title: string, max = 20000) => localized(z.string().max(max), title, "markdown")

/** Reference to a row in the panel's assets table; the licence lives there. */
export const image = (title: string) => z.uuid().meta({ title, "x-widget": "image" })

export const url = (title: string) => z.url({ protocol: /^https?$/ }).meta({ title, "x-widget": "url" })

export const time = (title: string) =>
  z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).meta({ title, "x-widget": "time" })

export const plain = (title: string, max = 200) => z.string().max(max).meta({ title, "x-widget": "text" })

/**
 * Where a button or link may point: a page of the same site (/kontakt), a place
 * on the page (#cennik), a web address, an e-mail or a phone number. Anything
 * else, above all `javascript:`, is refused, so content can never carry script
 * into a client's page. `//host` and `/\host` are refused too: browsers read
 * them as another site. Empty stays allowed (a button not linked yet).
 */
export const HREF = /^(|\/(?![/\\]).*|#.*|https?:\/\/.+|mailto:.+|tel:.+)$/i

export const link = (title: string) =>
  z.object({
    label: text("Text tlačidla", 60),
    href: z.string().max(500).regex(HREF, "Odkaz musí začínať /, #, https://, mailto: alebo tel:").meta({ title: "Odkaz", "x-widget": "url" }),
  }).meta({ title })

export const list = <T extends z.ZodType>(item: T, title: string, max = 100) => z.array(item).max(max).meta({ title })
