import { z } from "zod"
import { image, link, list, localized, markdown, plain, text, textarea, time, url } from "./fields"

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
      images: list(image("Obrázok"), "Obrázky", 60),
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
})

export const seoSchema = z.object({
  title: text("Titulok vo vyhľadávači", 70).optional(),
  description: textarea("Popis vo vyhľadávači", 170).optional(),
  ogImage: image("Obrázok pri zdieľaní").optional(),
}).meta({ title: "SEO" })

export type GlobalContent = z.infer<typeof globalSchema>
export type Seo = z.infer<typeof seoSchema>
