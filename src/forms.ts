import { z } from "zod"

// Contact form contract shared by sites and the panel (SPEC §3.5).

export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(1).max(5000),
  /** Visitor confirmed they read the privacy notice. */
  consent: z.literal(true),
  /** Honeypot: hidden field, filled only by bots. */
  website: z.string().max(0).optional(),
  page: z.string().max(300).optional(),
})

export type ContactSubmission = z.infer<typeof contactSchema>

export type FormResult = { ok: true } | { ok: false; error: "invalid" | "rate_limited" | "disabled" | "unavailable" }
