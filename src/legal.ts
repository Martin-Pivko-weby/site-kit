import { z } from "zod"
import { plain } from "./schema/fields"

// Legal pages every client site must have (SPEC §3.5): privacy notice (GDPR
// art. 13) and business details (§ 4 zákona 22/2004). Text templates v1 of
// 4. 11. 2026 from martinpivko-portfolio/docs/pravne/sablony-pravnych-stranok-klientov.md;
// keep both in sync when the lawyer changes anything.

export const LEGAL_PATHS = { privacy: "/ochrana-osobnych-udajov", imprint: "/pravne-informacie" } as const

const text = (title: string, max = 300) => plain(title, max)
const optional = (title: string, max = 300) => plain(title, max).optional()

/** Fields Martin fills in per client in the panel (document kind "legal"). */
export const legalSchema = z.object({
  obchodne_meno: text("Obchodné meno (presne podľa registra)", 200),
  sidlo: text("Sídlo alebo miesto podnikania"),
  ico: text("IČO", 20),
  dic: optional("DIČ", 20),
  ic_dph: optional("IČ DPH (len platiteľ DPH)", 20),
  register: text("Register zápisu (napr. Živnostenský register Okresného úradu …)"),
  cislo_zapisu: optional("Číslo zápisu / vložka", 80),
  email: z.email().meta({ title: "Kontaktný e-mail (aj na uplatnenie práv)" }),
  telefon: optional("Telefón", 40),
  dozorny_organ_soi: text("Inšpektorát SOI podľa sídla, s adresou"),
  rezervacie: z.boolean().default(false).meta({ title: "Web prijíma rezervácie" }),
  udaje_rezervacie: optional("Údaje pri rezervácii slovami (napr. meno, e-mail, termín pobytu)"),
  lehota_rezervacie: optional("Ako dlho sa rezervácie uchovávajú"),
  predava_spotrebitelom: z.boolean().default(false).meta({ title: "Predáva spotrebiteľom (sekcia o riešení sporov)" }),
  analytika: z.boolean().default(false).meta({ title: "Web meria návštevnosť (Vercel Web Analytics bez cookies)" }),
})

export type LegalFields = z.infer<typeof legalSchema>

/** Martin's details as processor; the panel fills them in, they are the same on every site. */
export type Processor = { name: string; address: string; ico: string }

export type LegalContent = { fields: LegalFields; processor: Processor | null; updatedAt: string }

/** What the contact form collects, in words (from contactSchema). */
export const CONTACT_FORM_DATA = "meno, e-mail, telefón (nepovinný) a text správy"

const REQUIRED: [keyof LegalFields, string][] = [
  ["obchodne_meno", "obchodné meno"], ["sidlo", "sídlo"], ["ico", "IČO"], ["register", "register"],
  ["email", "e-mail"], ["dozorny_organ_soi", "inšpektorát SOI"],
]

/** Missing data that blocks a launch: the pages would be incomplete. */
export function missingLegal(content: LegalContent | null): string[] {
  if (!content) return ["právne údaje klienta nie sú vyplnené a publikované"]
  const f = content.fields as Record<string, unknown>
  const missing = REQUIRED.filter(([k]) => !String(f[k] ?? "").trim()).map(([, label]) => label)
  if (content.fields.rezervacie) {
    if (!content.fields.udaje_rezervacie?.trim()) missing.push("údaje pri rezervácii")
    if (!content.fields.lehota_rezervacie?.trim()) missing.push("lehota uchovania rezervácií")
  }
  if (!content.processor?.name || !content.processor.address || !content.processor.ico) missing.push("tvoje údaje ako sprostredkovateľa (BUSINESS_* v systéme)")
  return missing
}

// ---------------------------------------------------------------- templates

const PRIVACY = `## Ochrana osobných údajov

Aktualizované {{datum_aktualizacie}}.

Na tejto stránke vysvetľujeme, ako spracúvame osobné údaje podľa nariadenia (EÚ) 2016/679 (GDPR) a zákona č. 18/2018 Z. z. o ochrane osobných údajov.

### Kto je prevádzkovateľ

{{obchodne_meno}}, {{sidlo}}, IČO {{ico}}, zapísaný v {{register}}{{#cislo_zapisu}} pod číslom {{cislo_zapisu}}{{/cislo_zapisu}}.
Kontakt: {{email}}{{#telefon}}, {{telefon}}{{/telefon}}.

### Aké údaje spracúvame a prečo

*Kontaktný formulár.* Ak nám napíšete cez formulár, spracúvame {{udaje_formulara}}. Údaje použijeme len na to, aby sme vám odpovedali, a ak o to požiadate, pripravili ponuku. Právny základ je čl. 6 ods. 1 písm. b) GDPR (opatrenia pred uzavretím zmluvy na vašu žiadosť). Pri všeobecných otázkach je to náš oprávnený záujem odpovedať na správy (čl. 6 ods. 1 písm. f) GDPR). Povinné sú len polia označené hviezdičkou, bez nich vám nevieme odpovedať.

{{#rezervacie}}
*Rezervácie.* Pri rezervácii spracúvame {{udaje_rezervacie}}, aby sme mohli rezerváciu prijať, potvrdiť a poskytnúť vám službu. Právny základ je čl. 6 ods. 1 písm. b) GDPR (plnenie zmluvy). Údaje, ktoré vyžadujú osobitné predpisy (napr. evidencia ubytovaných hostí), spracúvame podľa týchto predpisov a uchovávame ich tak dlho, ako vyžadujú.
{{/rezervacie}}

*Ochrana pred spamom.* Vašu IP adresu neukladáme v čitateľnej podobe. Na obmedzenie počtu správ z jedného zariadenia sa krátkodobo, najviac 24 hodín, uchová len jej odtlačok (hash). Právny základ je náš oprávnený záujem chrániť formulár pred zneužitím (čl. 6 ods. 1 písm. f) GDPR).

### Ako dlho údaje uchovávame

- Správy z kontaktného formulára: 12 mesiacov od odoslania, potom sa automaticky zmažú.
- Odtlačok IP adresy na ochranu pred spamom: najviac 24 hodín.
{{#rezervacie}}- Rezervácie: {{lehota_rezervacie}}.
{{/rezervacie}}- Ak z vašej správy vznikne zmluva, údaje potrebné na zmluvu a účtovníctvo uchovávame tak dlho, ako vyžaduje zákon (účtovné doklady 10 rokov).

### Kto sa k údajom dostane

Údaje nepredávame ani neposkytujeme na marketing. Pracujú s nimi len sprostredkovatelia, ktorí pre nás zabezpečujú web:

- **{{sprostredkovatel_meno}}**, {{sprostredkovatel_adresa}}, IČO {{sprostredkovatel_ico}}: tvorba, prevádzka a správa webu vrátane formulára. Spracúva údaje na základe zmluvy o spracúvaní osobných údajov.
- **Vercel Inc.** (USA): hosting webu.
- **Resend** (USA): doručenie správ z formulára e-mailom.
- **Supabase Inc.** (USA, dáta uložené v EÚ): bezpečné uloženie správ z formulára.

Prenos údajov do USA prebieha na základe rozhodnutia Európskej komisie o primeranosti (EU-U.S. Data Privacy Framework) alebo štandardných zmluvných doložiek.

### Cookies a meranie návštevnosti

Web nepoužíva cookies, ktoré by vyžadovali váš súhlas.{{#analytika}} Návštevnosť meriame anonymne a bez cookies (Vercel Web Analytics), takže z nej nevieme zistiť, kto ste.{{/analytika}} Písma sú uložené priamo na tomto webe a nenačítavajú sa od tretích strán.

### Vaše práva

Máte právo:

- vedieť, aké údaje o vás máme, a dostať ich kópiu,
- dať ich opraviť alebo vymazať,
- obmedziť ich spracúvanie,
- na prenosnosť údajov,
- namietať proti spracúvaniu na základe oprávneného záujmu.

Stačí napísať na {{email}}. Odpovieme najneskôr do jedného mesiaca.

Ak si myslíte, že s údajmi zaobchádzame v rozpore so zákonom, môžete podať sťažnosť dozornému orgánu: Úrad na ochranu osobných údajov Slovenskej republiky, Hraničná 12, 820 07 Bratislava 27, dataprotection.gov.sk.

Nerobíme automatizované rozhodovanie ani profilovanie.
`

const IMPRINT = `## Právne informácie

Údaje podľa § 4 zákona č. 22/2004 Z. z. o elektronickom obchode.

| Prevádzkovateľ webu | {{obchodne_meno}} |
| Sídlo / miesto podnikania | {{sidlo}} |
| IČO | {{ico}} |
| {{#dic}}DIČ{{/dic}} | {{dic}} |
| {{#ic_dph}}IČ DPH{{/ic_dph}} | {{ic_dph}} |
| Zápis | {{register}}{{#cislo_zapisu}}, číslo {{cislo_zapisu}}{{/cislo_zapisu}} |
| E-mail | {{email}} |
| {{#telefon}}Telefón{{/telefon}} | {{telefon}} |
| Dozorný orgán | {{dozorny_organ_soi}} |

{{#predava_spotrebitelom}}
### Riešenie sporov so spotrebiteľmi

Ak ste spotrebiteľ a nie ste spokojní s vybavením reklamácie alebo sa domnievate, že sme porušili vaše práva, môžete nás požiadať o nápravu. Ak vašej žiadosti nevyhovieme alebo neodpovieme do 30 dní, môžete podať návrh na alternatívne riešenie sporu subjektu alternatívneho riešenia sporov, napríklad Slovenskej obchodnej inšpekcii (www.soi.sk). Návrh môžete podať aj cez platformu RSO: https://ec.europa.eu/consumers/odr.
{{/predava_spotrebitelom}}

### Autorské práva

Obsah webu (texty, fotografie, logo) patrí prevádzkovateľovi alebo je použitý s licenciou. Web vytvoril {{sprostredkovatel_meno}}.

[Ochrana osobných údajov](${LEGAL_PATHS.privacy})
`

// ---------------------------------------------------------------- rendering

export type Inline = { text: string; bold?: boolean; italic?: boolean; href?: string }
export type LegalBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; lines: Inline[][] }
  | { type: "list"; items: Inline[][] }
  | { type: "table"; rows: [Inline[], Inline[]][] }

function values(content: LegalContent): Record<string, string | boolean | undefined> {
  const date = new Date(content.updatedAt)
  return {
    ...content.fields,
    udaje_formulara: CONTACT_FORM_DATA,
    sprostredkovatel_meno: content.processor?.name,
    sprostredkovatel_adresa: content.processor?.address,
    sprostredkovatel_ico: content.processor?.ico,
    datum_aktualizacie: `${date.getUTCDate()}. ${date.getUTCMonth() + 1}. ${date.getUTCFullYear()}`,
  }
}

const truthy = (v: unknown) => v === true || (typeof v === "string" && v.trim() !== "")

/** {{field}} and {{#field}} … {{/field}} (shown when true or non-empty). */
export function fill(template: string, data: Record<string, string | boolean | undefined>): string {
  const sections = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key: string, body: string) => (truthy(data[key]) ? body : ""))
  return sections.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const v = data[key]
    return typeof v === "string" ? v : ""
  })
}

function inline(text: string): Inline[] {
  const out: Inline[] = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) })
    if (m[1]) out.push({ text: m[1], bold: true })
    else if (m[2]) out.push({ text: m[2], italic: true })
    else out.push({ text: m[3], href: m[4] })
    last = m.index! + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last) })
  return out
}

/** The small markdown subset the templates use, as data: each site renders it in its own style. */
export function parseLegal(markdown: string): LegalBlock[] {
  const blocks: LegalBlock[] = []
  for (const chunk of markdown.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((l) => l.trimEnd()).filter((l) => l.trim())
    if (!lines.length) continue
    if (lines[0].startsWith("### ")) blocks.push({ type: "heading", level: 3, text: lines[0].slice(4) })
    else if (lines[0].startsWith("## ")) blocks.push({ type: "heading", level: 2, text: lines[0].slice(3) })
    else if (lines.every((l) => l.startsWith("- "))) blocks.push({ type: "list", items: lines.map((l) => inline(l.slice(2))) })
    else if (lines.every((l) => l.startsWith("|"))) {
      const rows = lines
        .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
        .filter(([label, value]) => label && value) // a row whose optional field is empty disappears
        .map(([label, value]) => [inline(label), inline(value)] as [Inline[], Inline[]])
      if (rows.length) blocks.push({ type: "table", rows })
    } else blocks.push({ type: "paragraph", lines: lines.map(inline) })
  }
  return blocks
}

export function privacyPage(content: LegalContent): LegalBlock[] {
  return parseLegal(fill(PRIVACY, values(content)))
}

export function imprintPage(content: LegalContent): LegalBlock[] {
  return parseLegal(fill(IMPRINT, values(content)))
}
