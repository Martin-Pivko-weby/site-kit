import { test } from "node:test"
import assert from "node:assert/strict"
import { link } from "./fields"

const ok = (href: string) => link("Tlačidlo").safeParse({ label: { sk: "Ďalej" }, href }).success

test("links point only to the site itself, the web, e-mail or phone", () => {
  for (const href of ["", "/", "/kontakt", "/en/pricing?x=1#top", "#cennik", "https://example.sk/a", "http://example.sk", "mailto:info@example.sk", "tel:+421900000000", "HTTPS://EXAMPLE.SK"]) {
    assert.equal(ok(href), true, href)
  }
  for (const href of ["javascript:alert(1)", "JavaScript:alert(1)", " javascript:alert(1)", "data:text/html,<script>1</script>", "vbscript:x", "//evil.example", "/\\evil.example", "kontakt", "https://", "ftp://example.sk/x"]) {
    assert.equal(ok(href), false, href)
  }
})
