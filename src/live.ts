// Content that changes with the date or loads only on a click: the announcement
// strip, the events archive and click-to-load video. Pure; sites call these at
// build time and again in the browser, so a static page stays right without a
// rebuild (no server needed). Dates are calendar days in Bratislava.

const ZONE = "Europe/Bratislava"

/** "2026-11-20" for the given moment, in Bratislava. */
export function bratislavaDate(now: Date = new Date()): string {
  return now.toLocaleDateString("sv-SE", { timeZone: ZONE })
}

/** Is a from–to window (both days included) on today? */
export function isBetween(from: string, to: string, now: Date = new Date()): boolean {
  const today = bratislavaDate(now)
  return from <= today && today <= to
}

/** The announcement to show today, or null outside its window. */
export function activeAnnouncement<T extends { from: string; to: string }>(a: T | null | undefined, now: Date = new Date()): T | null {
  return a && isBetween(a.from, a.to, now) ? a : null
}

/**
 * Upcoming events (today included, soonest first) and past ones (latest first).
 * An event counts as upcoming for its whole day.
 */
export function splitEvents<T extends { date: string; time?: string }>(items: T[], now: Date = new Date()): { upcoming: T[]; past: T[] } {
  const today = bratislavaDate(now)
  const key = (e: T) => `${e.date}T${e.time ?? "00:00"}`
  const upcoming = items.filter((e) => e.date >= today).sort((a, b) => key(a).localeCompare(key(b)))
  const past = items.filter((e) => e.date < today).sort((a, b) => key(b).localeCompare(key(a)))
  return { upcoming, past }
}

export type VideoEmbed = { provider: "youtube" | "vimeo"; id: string; embedUrl: string; thumbnailUrl: string | null }

/**
 * The player address for a YouTube or Vimeo link. YouTube uses the
 * youtube-nocookie domain; either loads only when the visitor clicks play.
 */
export function videoEmbed(url: string): VideoEmbed | null {
  let u: URL
  try { u = new URL(url) } catch { return null }
  if (u.protocol !== "https:") return null
  const host = u.hostname.replace(/^www\./, "")
  let id: string | null = null
  if (host === "youtube.com") id = u.pathname === "/watch" ? u.searchParams.get("v") : u.pathname.match(/^\/shorts\/([\w-]+)/)?.[1] ?? null
  else if (host === "youtu.be") id = u.pathname.slice(1).split("/")[0] || null
  if (id && /^[\w-]{6,20}$/.test(id)) {
    return { provider: "youtube", id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`, thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` }
  }
  if (host === "vimeo.com") {
    const v = u.pathname.match(/^\/(\d{5,12})/)?.[1]
    if (v) return { provider: "vimeo", id: v, embedUrl: `https://player.vimeo.com/video/${v}?autoplay=1&dnt=1`, thumbnailUrl: null }
  }
  return null
}

/** Gallery categories in first-seen order; empty when no photo has one. */
export function galleryCategories(items: { category?: string | null }[]): string[] {
  return [...new Set(items.map((i) => i.category?.trim()).filter((c): c is string => Boolean(c)))]
}
