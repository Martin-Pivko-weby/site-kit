import { test } from "node:test"
import assert from "node:assert/strict"
import { activeAnnouncement, bratislavaDate, galleryCategories, isBetween, splitEvents, videoEmbed } from "./live"
import { VIDEO_URL } from "./schema/fields"

// 20. 11. 2026, 23:30 in Bratislava (22:30 UTC): still the 20th there.
const late = new Date("2026-11-20T22:30:00Z")

test("dates are Bratislava days, the window includes both ends", () => {
  assert.equal(bratislavaDate(late), "2026-11-20")
  assert.equal(bratislavaDate(new Date("2026-11-20T23:30:00Z")), "2026-11-21")
  assert.ok(isBetween("2026-11-20", "2026-11-20", late))
  assert.ok(!isBetween("2026-11-21", "2026-12-01", late))
  const a = { from: "2026-12-23", to: "2027-01-02", text: "Zatvorené" }
  assert.equal(activeAnnouncement(a, new Date("2026-12-22T12:00:00Z")), null)
  assert.equal(activeAnnouncement(a, new Date("2027-01-02T20:00:00Z")), a)
  assert.equal(activeAnnouncement(a, new Date("2027-01-03T08:00:00Z")), null)
  assert.equal(activeAnnouncement(undefined, late), null)
})

test("events: today's still upcoming, soonest first; past latest first", () => {
  const e = [
    { title: "B", date: "2026-12-13", time: "18:00" },
    { title: "today", date: "2026-11-20", time: "10:00" },
    { title: "old", date: "2026-10-01" },
    { title: "A", date: "2026-12-13", time: "09:00" },
    { title: "older", date: "2026-09-01" },
  ]
  const { upcoming, past } = splitEvents(e, late)
  assert.deepEqual(upcoming.map((x) => x.title), ["today", "A", "B"])
  assert.deepEqual(past.map((x) => x.title), ["old", "older"])
})

test("video: YouTube (nocookie) and Vimeo only; the schema accepts the same links", () => {
  for (const u of ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "https://youtube.com/watch?v=dQw4w9WgXcQ&t=30", "https://youtu.be/dQw4w9WgXcQ", "https://www.youtube.com/shorts/dQw4w9WgXcQ"]) {
    assert.equal(videoEmbed(u)?.embedUrl, "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0", u)
    assert.ok(VIDEO_URL.test(u), u)
  }
  assert.equal(videoEmbed("https://vimeo.com/76979871")?.embedUrl, "https://player.vimeo.com/video/76979871?autoplay=1&dnt=1")
  assert.ok(VIDEO_URL.test("https://vimeo.com/76979871"))
  for (const u of ["http://youtu.be/dQw4w9WgXcQ", "https://evil.example/watch?v=dQw4w9WgXcQ", "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ", "javascript:alert(1)", "https://youtube.com/watch?v=\"><script>"]) {
    assert.equal(videoEmbed(u), null, u)
    assert.ok(!VIDEO_URL.test(u), u)
  }
})

test("gallery categories keep first-seen order and skip empty ones", () => {
  assert.deepEqual(galleryCategories([{ category: "Izby" }, {}, { category: "Okolie" }, { category: "Izby" }, { category: " " }]), ["Izby", "Okolie"])
  assert.deepEqual(galleryCategories([{}, {}]), [])
})
