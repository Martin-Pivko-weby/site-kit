import { test } from "node:test"
import assert from "node:assert/strict"
import { defineRegistry, exportSchemas, globalSchema } from "./index"

const reg = defineRegistry()
const sk = (s: string) => ({ sk: s })
const img = "7b0f4c1e-0c2a-4a8e-9a55-2f9a0d6b1c11"
const page = (type: string, data: Record<string, unknown>) => reg.parsePage({ blocks: [{ id: "b1", type, data }] })

test("new blocks parse with realistic content", () => {
  const cases: [string, Record<string, unknown>][] = [
    ["steps", { heading: sk("Ako to prebieha"), items: [{ title: sk("Zavoláte") }, { title: sk("Obhliadka"), body: sk("Zmeriame strechu.") }] }],
    ["before_after", { items: [{ before: img, after: img, caption: sk("Obývačka, Senec") }] }],
    ["stats", { items: [{ value: "20", label: sk("rokov praxe") }], badges: [{ name: sk("Certifikovaný pokrývač") }] }],
    ["events", { heading: sk("Akcie"), items: [{ title: sk("Degustácia"), date: "2026-12-13", time: "18:00", price: "25 €" }] }],
    ["video", { url: "https://youtu.be/dQw4w9WgXcQ" }],
    ["jobs", { heading: sk("Hľadáme"), items: [{ title: sk("Pekár"), offer: [sk("víkendy voľno")], contact: { label: sk("Zavolať"), href: "tel:+421905000000" } }] }],
  ]
  for (const [type, data] of cases) assert.equal(page(type, data).ok, true, type)
})

test("changed blocks still accept content written before the change", () => {
  assert.ok(page("gallery", { images: [img] }).ok)
  assert.ok(page("hero", { heading: sk("Vitajte") }).ok)
  assert.ok(page("services", { heading: sk("Služby"), items: [{ name: sk("Masáž") }] }).ok)
  assert.ok(page("testimonials", { heading: sk("Referencie"), items: [] }).ok)
  assert.ok(page("contact", { heading: sk("Kontakt") }).ok)
  const hero = page("hero", { heading: sk("Vitajte") })
  assert.ok(hero.ok && hero.data.blocks[0].data.layout === "split")
})

test("new fields on changed blocks", () => {
  assert.ok(page("gallery", { items: [{ image: img, caption: sk("Izba"), category: sk("Izby") }] }).ok)
  assert.ok(page("testimonials", { heading: sk("R"), items: [], google: { rating: 4.9, count: 87, url: "https://maps.google.com/?cid=1", asOf: "2026-11-18" } }).ok)
  assert.ok(!page("testimonials", { heading: sk("R"), items: [], google: { rating: 6, count: 1, url: "https://g.co", asOf: "2026-11-18" } }).ok)
  assert.ok(page("contact", { heading: sk("K"), locations: [{ name: sk("Trnava"), street: "Hlavná 12", city: "Trnava" }] }).ok)
  assert.ok(page("services", { heading: sk("S"), items: [{ name: sk("Masáž"), price: "40 €", duration: sk("45 min"), link: { label: sk("Viac"), href: "/masaz" } }] }).ok)
})

test("video takes only YouTube or Vimeo; jobs contact cannot carry script", () => {
  assert.ok(!page("video", { url: "https://evil.example/x.mp4" }).ok)
  assert.ok(!page("jobs", { heading: sk("H"), items: [{ title: sk("P"), contact: { label: sk("x"), href: "javascript:alert(1)" } }] }).ok)
})

test("announcement in the global document", () => {
  const base = { businessName: "Kaderníctvo Mirel" }
  assert.ok(globalSchema.safeParse({ ...base, announcement: { text: sk("Zatvorené"), from: "2026-12-23", to: "2027-01-02" } }).success)
  assert.ok(globalSchema.safeParse(base).success)
  assert.ok(!globalSchema.safeParse({ ...base, announcement: { text: sk("x"), from: "23. 12.", to: "2027-01-02" } }).success)
})

test("every block exports a JSON schema for the panel editor", () => {
  const types = exportSchemas(reg).map((s) => s.type)
  for (const t of ["steps", "before_after", "stats", "events", "video", "jobs"]) assert.ok(types.includes(t), t)
})
