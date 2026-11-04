import { test } from "node:test"
import assert from "node:assert/strict"
import { fill, imprintPage, missingLegal, privacyPage, legalSchema, type LegalContent } from "./legal"

const content = (over: Partial<LegalContent["fields"]> = {}): LegalContent => ({
  fields: legalSchema.parse({
    obchodne_meno: "Penzión Pod Skalkou s.r.o.", sidlo: "Hlavná 1, 033 01 Liptovský Hrádok", ico: "12345678",
    register: "Obchodný register Okresného súdu Žilina", email: "info@penzion.sk",
    dozorny_organ_soi: "Inšpektorát SOI pre Žilinský kraj, Predmestská 71, 011 79 Žilina", ...over,
  }),
  processor: { name: "Martin Pivko", address: "Liptovský Mikuláš", ico: "99999999" },
  updatedAt: "2026-11-04T10:00:00Z",
})

const text = (blocks: ReturnType<typeof privacyPage>) => JSON.stringify(blocks)

test("fill: fields and conditional sections", () => {
  assert.equal(fill("a {{x}} {{#y}}Y={{y}}{{/y}}{{#z}}Z{{/z}}", { x: "1", y: "2", z: false }), "a 1 Y=2")
  assert.equal(fill("{{#t}}on{{/t}}", { t: true }), "on")
})

test("privacy page: controller, processor, date; optional sections only when set", () => {
  const plain = text(privacyPage(content()))
  assert.match(plain, /Penzión Pod Skalkou s.r.o./)
  assert.match(plain, /Martin Pivko/)
  assert.match(plain, /Aktualizované 4\. 11\. 2026/)
  assert.match(plain, /meno, e-mail, telefón \(nepovinný\) a text správy/)
  assert.doesNotMatch(plain, /Rezervácie|Vercel Web Analytics|\{\{/)
  const full = text(privacyPage(content({ rezervacie: true, udaje_rezervacie: "meno a termín", lehota_rezervacie: "12 mesiacov", analytika: true, telefon: "+421 900" })))
  assert.match(full, /meno a termín/)
  assert.match(full, /Rezervácie: 12 mesiacov/)
  assert.match(full, /Vercel Web Analytics/)
  assert.match(full, /\+421 900/)
})

test("imprint: empty optional rows disappear, consumer section only when selling to consumers", () => {
  const blocks = imprintPage(content())
  const table = blocks.find((b) => b.type === "table")!
  // prevádzkovateľ, sídlo, IČO, zápis, e-mail, dozorný orgán; no DIČ, IČ DPH or phone given
  assert.equal(table.type === "table" && table.rows.length, 6)
  assert.doesNotMatch(text(blocks), /DIČ|IČ DPH|Telefón|RSO/)
  const shop = imprintPage(content({ dic: "2023", predava_spotrebitelom: true }))
  assert.match(text(shop), /DIČ.*2023/)
  assert.match(text(shop), /ec\.europa\.eu\/consumers\/odr/)
  assert.ok(shop.some((b) => b.type === "paragraph" && b.lines.flat().some((i) => i.href === "/ochrana-osobnych-udajov")))
})

test("missing legal data blocks the launch", () => {
  assert.deepEqual(missingLegal(content()), [])
  assert.equal(missingLegal(null).length, 1)
  assert.deepEqual(missingLegal({ ...content(), processor: null }), ["tvoje údaje ako sprostredkovateľa (BUSINESS_* v systéme)"])
  assert.deepEqual(missingLegal(content({ rezervacie: true })), ["údaje pri rezervácii", "lehota uchovania rezervácií"])
  assert.deepEqual(missingLegal(content({ ico: " " })), ["IČO"])
})
