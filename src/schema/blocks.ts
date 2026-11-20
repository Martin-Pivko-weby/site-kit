import { z } from "zod"
import { VIDEO_URL, image, link, list, localized, markdown, plain, text, textarea, time, url } from "./fields"

// Content types only. How a block looks is each site's own business (SPEC §3.3).
// Bump `version` and add a migration when a change is not backwards compatible.

export const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

const day = z.object({
  day: z.enum(DAYS).meta({ title: "Deň" }),
  closed: z.boolean().default(false).meta({ title: "Zatvorené" }),
  open: time("Otvára").optional(),
  close: time("Zatvára").optional(),
}).meta({ title: "Deň" })

export const globalBlocks = {
  hero: {
    version: 1,
    title: "Úvod",
    schema: z.object({
      heading: text("Nadpis", 120),
      subheading: textarea("Podnadpis", 400).optional(),
      image: image("Obrázok").optional(),
      cta: link("Tlačidlo").optional(),
      cta2: link("Druhé tlačidlo (napr. Zavolať)").optional(),
      layout: z.enum(["split", "full"]).default("split").meta({ title: "Rozloženie" }),
    }),
  },
  about: {
    version: 1,
    title: "O nás",
    schema: z.object({
      heading: text("Nadpis"),
      body: markdown("Text"),
      image: image("Obrázok").optional(),
    }),
  },
  services: {
    version: 1,
    title: "Služby",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        name: text("Názov"),
        description: textarea("Popis").optional(),
        image: image("Obrázok").optional(),
        icon: image("Ikona (namiesto fotky)").optional(),
        price: plain("Cena", 40).optional(),
        duration: text("Trvanie (napr. 45 min)", 40).optional(),
        link: link("Odkaz na podstránku služby").optional(),
      }).meta({ title: "Služba" }), "Služby"),
    }),
  },
  pricing: {
    version: 1,
    title: "Cenník",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        name: text("Položka"),
        price: plain("Cena", 40),
        note: text("Poznámka").optional(),
      }).meta({ title: "Položka" }), "Položky", 300),
      footnote: textarea("Poznámka pod cenníkom").optional(),
    }),
  },
  opening_hours: {
    version: 1,
    title: "Otváracie hodiny",
    // Hours live in the global document; this block only places them on a page.
    schema: z.object({
      heading: text("Nadpis"),
      note: textarea("Poznámka (sviatky, dovolenka)").optional(),
    }),
  },
  gallery: {
    version: 1,
    title: "Galéria",
    schema: z.object({
      heading: text("Nadpis").optional(),
      // Older sites: plain images. New content uses items (caption, category).
      images: list(image("Obrázok"), "Obrázky (bez popisu)", 60).default([]),
      items: list(z.object({
        image: image("Obrázok"),
        caption: text("Popis", 140).optional(),
        category: text("Kategória (napr. Izby)", 40).optional(),
      }).meta({ title: "Fotka" }), "Fotky s popisom", 60).optional(),
    }),
  },
  testimonials: {
    version: 1,
    title: "Referencie",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        quote: textarea("Citát", 800),
        author: plain("Meno", 80),
        role: text("Kto to je (firma, mesto)").optional(),
      }).meta({ title: "Referencia" }), "Referencie", 30),
      // Typed in by hand at launch and during maintenance: no Google script on the site.
      google: z.object({
        rating: z.number().min(1).max(5).meta({ title: "Hodnotenie (napr. 4.9)" }),
        count: z.number().int().min(1).meta({ title: "Počet recenzií" }),
        url: url("Odkaz na Google profil"),
        asOf: z.iso.date().meta({ title: "Stav k dátumu" }),
      }).meta({ title: "Hodnotenie na Google" }).optional(),
    }),
  },
  faq: {
    version: 1,
    title: "Časté otázky",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        question: text("Otázka", 200),
        answer: textarea("Odpoveď"),
      }).meta({ title: "Otázka" }), "Otázky", 50),
    }),
  },
  cta: {
    version: 1,
    title: "Výzva k akcii",
    schema: z.object({
      heading: text("Nadpis"),
      body: textarea("Text").optional(),
      button: link("Tlačidlo"),
    }),
  },
  contact: {
    version: 1,
    title: "Kontakt",
    schema: z.object({
      heading: text("Nadpis"),
      body: textarea("Text").optional(),
      showMap: z.boolean().default(true).meta({ title: "Zobraziť mapu" }),
      showForm: z.boolean().default(true).meta({ title: "Zobraziť formulár" }),
      // Two or more branches; with one, the global address and hours are used.
      locations: list(z.object({
        name: text("Názov prevádzky (napr. Trnava)", 60),
        street: plain("Ulica a číslo", 120),
        city: plain("Mesto", 80),
        phone: plain("Telefón", 40).optional(),
        hours: textarea("Otváracie hodiny", 300).optional(),
        mapUrl: url("Odkaz na mapu").optional(),
      }).meta({ title: "Prevádzka" }), "Prevádzky", 10).optional(),
    }),
  },
  news: {
    version: 1,
    title: "Aktuality",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        date: z.iso.date().meta({ title: "Dátum" }),
        title: text("Nadpis"),
        body: markdown("Text"),
        image: image("Obrázok").optional(),
      }).meta({ title: "Aktualita" }), "Aktuality", 200),
    }),
  },
  menu: {
    version: 1,
    title: "Menu a jedálny lístok",
    schema: z.object({
      heading: text("Nadpis"),
      daily: list(z.object({
        date: z.iso.date().meta({ title: "Dátum" }),
        items: list(z.object({ name: text("Jedlo"), price: plain("Cena", 40) }).meta({ title: "Jedlo" }), "Jedlá", 20),
      }).meta({ title: "Denné menu" }), "Denné menu", 14).optional(),
      sections: list(z.object({
        name: text("Sekcia (napr. Polievky)"),
        items: list(z.object({
          name: text("Jedlo"),
          description: textarea("Popis", 400).optional(),
          price: plain("Cena", 40),
          allergens: plain("Alergény", 60).optional(),
        }).meta({ title: "Jedlo" }), "Jedlá", 100),
      }).meta({ title: "Sekcia" }), "Jedálny lístok", 30),
    }),
  },
  rooms: {
    version: 1,
    title: "Izby",
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        name: text("Názov izby"),
        description: textarea("Popis"),
        capacity: z.number().int().min(1).max(30).meta({ title: "Počet osôb" }),
        priceFrom: plain("Cena od", 40).optional(),
        images: list(image("Fotka"), "Fotky", 20),
      }).meta({ title: "Izba" }), "Izby", 40),
      bookingUrl: url("Odkaz na rezerváciu").optional(),
    }),
  },
  team: {
    version: 1,
    title: "Tím",
    schema: z.object({
      heading: text("Nadpis"),
      intro: textarea("Úvod").optional(),
      items: list(z.object({
        name: plain("Meno", 80),
        role: text("Rola (napr. veterinárka)"),
        line: textarea("Niečo osobné", 400).optional(),
        image: image("Fotka").optional(),
      }).meta({ title: "Človek" }), "Ľudia", 40),
    }),
  },
  stories: {
    version: 1,
    title: "Príbehy",
    // A case told in steps: what happened, what was done, how it is today.
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        name: plain("Meno (napr. Bruno)", 80),
        about: text("Kto to je (napr. labrador, 9 rokov)").optional(),
        before: textarea("Čo sa stalo"),
        treatment: textarea("Čo sme spravili").optional(),
        today: textarea("Ako je to dnes"),
        image: image("Fotka").optional(),
      }).meta({ title: "Príbeh" }), "Príbehy", 30),
    }),
  },
  steps: {
    version: 1,
    title: "Ako to prebieha",
    schema: z.object({
      heading: text("Nadpis"),
      intro: textarea("Úvod", 400).optional(),
      items: list(z.object({
        title: text("Krok", 80),
        body: textarea("Popis", 300).optional(),
      }).meta({ title: "Krok" }), "Kroky", 6),
    }),
  },
  before_after: {
    version: 1,
    title: "Pred a po",
    // Both photos from the same place and angle: the site shows them under one slider.
    schema: z.object({
      heading: text("Nadpis").optional(),
      items: list(z.object({
        before: image("Fotka pred"),
        after: image("Fotka po"),
        caption: text("Popis (napr. Obývačka, Senec, 3 dni)", 140).optional(),
      }).meta({ title: "Dvojica" }), "Dvojice", 12),
    }),
  },
  stats: {
    version: 1,
    title: "Čísla a dôvera",
    // Only figures the client can back up.
    schema: z.object({
      heading: text("Nadpis").optional(),
      items: list(z.object({
        value: plain("Číslo (napr. 20, 4,8, 10 r.)", 20),
        label: text("Popis (napr. rokov praxe)", 80),
      }).meta({ title: "Číslo" }), "Čísla", 4),
      badgesHeading: text("Nadpis log (napr. Certifikáty a partneri)").optional(),
      badges: list(z.object({
        name: text("Názov certifikátu alebo partnera", 80),
        image: image("Logo").optional(),
      }).meta({ title: "Certifikát alebo partner" }), "Certifikáty a partneri", 12).default([]),
    }),
  },
  events: {
    version: 1,
    title: "Akcie",
    // Past events move to an archive by themselves (pastEvents/upcomingEvents).
    schema: z.object({
      heading: text("Nadpis"),
      items: list(z.object({
        title: text("Názov", 120),
        date: z.iso.date().meta({ title: "Dátum" }),
        time: time("Čas").optional(),
        place: text("Miesto", 120).optional(),
        price: plain("Cena (napr. 25 €, zadarmo)", 40).optional(),
        description: textarea("Popis", 800).optional(),
        image: image("Fotka").optional(),
        link: link("Odkaz na viac").optional(),
      }).meta({ title: "Akcia" }), "Akcie", 100),
      showArchive: z.boolean().default(true).meta({ title: "Zobraziť minulé akcie" }),
    }),
  },
  video: {
    version: 1,
    title: "Video",
    // Loaded only after a click (videoEmbed), so no third-party cookies before it.
    schema: z.object({
      heading: text("Nadpis").optional(),
      body: textarea("Text", 600).optional(),
      url: z.string().max(300).regex(VIDEO_URL, "Odkaz musí byť na YouTube alebo Vimeo").meta({ title: "Odkaz na video (YouTube alebo Vimeo)", "x-widget": "url" }),
      poster: image("Náhľadový obrázok").optional(),
    }),
  },
  jobs: {
    version: 1,
    title: "Hľadáme kolegu",
    // No application form: a position says how to get in touch.
    schema: z.object({
      heading: text("Nadpis"),
      intro: textarea("Úvod", 400).optional(),
      items: list(z.object({
        title: text("Pozícia", 80),
        terms: text("Úväzok (napr. plný úväzok)", 60).optional(),
        place: text("Miesto", 60).optional(),
        pay: text("Mzda (napr. od 1 200 € brutto)", 60).optional(),
        offer: list(text("Bod", 160), "Čo ponúkame", 10).default([]),
        expect: list(text("Bod", 160), "Čo očakávame", 10).default([]),
        contact: link("Ako sa ozvať (tel: alebo mailto:)"),
      }).meta({ title: "Pozícia" }), "Pozície", 10),
    }),
  },
  rich_text: {
    version: 1,
    title: "Text",
    schema: z.object({ body: markdown("Text") }),
  },
} satisfies Record<string, BlockDefinition>

export type BlockDefinition = { version: number; title: string; schema: z.ZodObject }

// ---------------------------------------------------------------- documents

export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok", "youtube", "linkedin", "google"] as const

export const globalSchema = z.object({
  businessName: plain("Názov firmy", 120),
  phone: plain("Telefón", 40).optional(),
  email: z.email().meta({ title: "E-mail" }).optional(),
  address: z.object({
    street: plain("Ulica a číslo", 120),
    city: plain("Mesto", 80),
    zip: plain("PSČ", 12),
  }).meta({ title: "Adresa" }).optional(),
  hours: list(day, "Otváracie hodiny", 7).default([]),
  socials: list(z.object({
    network: z.enum(SOCIAL_NETWORKS).meta({ title: "Sieť" }),
    url: url("Odkaz"),
  }).meta({ title: "Sociálna sieť" }), "Sociálne siete", 10).default([]),
  mapUrl: url("Odkaz na mapu").optional(),
  footerNote: localized(z.string().max(300), "Poznámka v päte").optional(),
  // A strip above the header on every page, shown only between from and to (activeAnnouncement).
  announcement: z.object({
    text: text("Text oznamu", 160),
    link: link("Odkaz").optional(),
    from: z.iso.date().meta({ title: "Zobraziť od" }),
    to: z.iso.date().meta({ title: "Zobraziť do (vrátane)" }),
    tone: z.enum(["normal", "important"]).default("normal").meta({ title: "Tón" }),
  }).meta({ title: "Oznam" }).optional(),
})

export const seoSchema = z.object({
  title: text("Titulok vo vyhľadávači", 70).optional(),
  description: textarea("Popis vo vyhľadávači", 170).optional(),
  ogImage: image("Obrázok pri zdieľaní").optional(),
}).meta({ title: "SEO" })

export type GlobalContent = z.infer<typeof globalSchema>
export type Seo = z.infer<typeof seoSchema>
