import { test } from "node:test"
import assert from "node:assert/strict"
import { z } from "zod"
import { sign, verify } from "./hmac"
import { defineRegistry, exportSchemas } from "./schema/registry"
import { text } from "./schema/fields"
import { findDocument, type SitePayload } from "./client"
import { localePath } from "./seo"

const IMG = "3f0b6a9e-8a3e-4d3c-9a57-2d7c0c1f4b11"

test("hmac: valid signature passes, tampering and old timestamps fail", () => {
  const now = 1_800_000_000_000
  const header = sign("s3cret", '{"tags":["x"]}', now)
  assert.equal(verify("s3cret", '{"tags":["x"]}', header, now), true)
  assert.equal(verify("s3cret", '{"tags":["y"]}', header, now), false)
  assert.equal(verify("other", '{"tags":["x"]}', header, now), false)
  assert.equal(verify("s3cret", '{"tags":["x"]}', header, now + 6 * 60 * 1000), false)
  assert.equal(verify("s3cret", "", null, now), false)
  assert.equal(verify("s3cret", "", "t=1,v1=zz", now), false)
})

test("registry: valid page parses and gets defaults", () => {
  const r = defineRegistry().parsePage({
    blocks: [
      { id: "a", type: "hero", data: { heading: { sk: "Vitajte" }, image: IMG } },
      { id: "b", type: "contact", data: { heading: { sk: "Kontakt" } } },
    ],
  })
  assert.ok(r.ok)
  assert.equal(r.data.blocks[1].data.showMap, true)
  assert.deepEqual(r.data.seo, {})
})

test("registry: team and stories blocks parse, and a story needs what happened and today", () => {
  const ok = defineRegistry().parsePage({
    blocks: [
      { id: "t", type: "team", data: { heading: { sk: "Náš tím" }, items: [{ name: "Jana", role: { sk: "sestra" }, image: IMG }] } },
      { id: "s", type: "stories", data: { heading: { sk: "Príbehy" }, items: [{ name: "Bruno", before: { sk: "Zlomená labka" }, today: { sk: "Behá" } }] } },
    ],
  })
  assert.ok(ok.ok)
  const bad = defineRegistry().parsePage({
    blocks: [{ id: "s", type: "stories", data: { heading: { sk: "Príbehy" }, items: [{ name: "Bruno", before: { sk: "Zlomená labka" } }] } }],
  })
  assert.ok(!bad.ok)
  assert.match(bad.issues.join(" "), /today/)
})

test("registry: unknown blocks, bad data and duplicate ids are reported", () => {
  const r = defineRegistry().parsePage({
    blocks: [
      { id: "a", type: "nope", data: {} },
      { id: "a", type: "pricing", data: { heading: { sk: "Cenník" }, items: [{ name: { sk: "Strih" } }] } },
      { id: "c", type: "hero", data: { heading: { SK: "zlý jazyk" }, image: "not-a-uuid" } },
    ],
  })
  assert.equal(r.ok, false)
  if (r.ok) return
  const all = r.issues.join("\n")
  assert.match(all, /unknown block "nope"/)
  assert.match(all, /duplicate "a"/)
  assert.match(all, /blocks\.1\.data\.items\.0\.price/)
  assert.match(all, /blocks\.2\.data\.image/)
  assert.match(all, /blocks\.2\.data\.heading/)
})

test("registry: custom blocks work and may not shadow global ones", () => {
  const registry = defineRegistry({
    trail_map: { version: 1, title: "Mapa túr", schema: z.object({ heading: text("Nadpis") }) },
  })
  assert.ok(registry.parsePage({ blocks: [{ id: "t", type: "trail_map", data: { heading: { sk: "Túry" } } }] }).ok)
  assert.throws(() => defineRegistry({ hero: { version: 1, title: "x", schema: z.object({}) } }), /shadows/)
})

test("exportSchemas carries form hints for the panel", () => {
  const hero = exportSchemas(defineRegistry()).find((s) => s.type === "hero")!
  const props = (hero.json_schema as { properties: Record<string, Record<string, unknown>> }).properties
  assert.equal(props.heading["x-localized"], true)
  assert.equal(props.heading.title, "Nadpis")
  assert.equal(props.image["x-widget"], "image")
})

test("paths: default locale at root, others prefixed; lookup by path", () => {
  assert.equal(localePath("sk", "sk", "/kontakt"), "/kontakt")
  assert.equal(localePath("sk", "en", "/contact"), "/en/contact")
  assert.equal(localePath("sk", "en", "/"), "/en")
  const payload = { documents: [{ id: "1", key: "kontakt", path: { sk: "/kontakt", en: "/contact" } }] } as unknown as SitePayload
  assert.equal(findDocument(payload, "sk", "kontakt/")?.id, "1")
  assert.equal(findDocument(payload, "en", "/contact")?.id, "1")
  assert.equal(findDocument(payload, "sk", "/contact"), undefined)
})
