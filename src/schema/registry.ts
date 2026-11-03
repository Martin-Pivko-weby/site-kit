import { z } from "zod"
import { globalBlocks, seoSchema, type BlockDefinition } from "./blocks"

export type Block = { id: string; type: string; variant?: string; hidden?: boolean; data: Record<string, unknown> }
export type PageData = { seo: z.infer<typeof seoSchema>; blocks: Block[] }

export type Registry = {
  blocks: Record<string, BlockDefinition>
  parsePage(input: unknown): { ok: true; data: PageData } | { ok: false; issues: string[] }
}

const envelope = z.object({
  id: z.string().min(1).max(64),
  type: z.string().regex(/^[a-z][a-z0-9_]*$/),
  variant: z.string().max(40).optional(),
  hidden: z.boolean().optional(),
  data: z.record(z.string(), z.unknown()),
})

/**
 * A site's registry: the global blocks plus any custom ones it declares in
 * site.blocks.ts. Custom types may not shadow global ones.
 */
export function defineRegistry(custom: Record<string, BlockDefinition> = {}): Registry {
  for (const type of Object.keys(custom)) {
    if (type in globalBlocks) throw new Error(`custom block "${type}" shadows a global block`)
  }
  const blocks: Record<string, BlockDefinition> = { ...globalBlocks, ...custom }

  return {
    blocks,
    parsePage(input) {
      const shape = z.object({ seo: seoSchema.default({}), blocks: z.array(envelope).max(80) }).safeParse(input)
      if (!shape.success) return { ok: false, issues: shape.error.issues.map(formatIssue) }

      const issues: string[] = []
      const ids = new Set<string>()
      const parsed: Block[] = []
      shape.data.blocks.forEach((block, index) => {
        if (ids.has(block.id)) issues.push(`blocks.${index}.id: duplicate "${block.id}"`)
        ids.add(block.id)
        const definition = blocks[block.type]
        if (!definition) {
          issues.push(`blocks.${index}.type: unknown block "${block.type}"`)
          return
        }
        const data = definition.schema.safeParse(block.data)
        if (!data.success) {
          for (const issue of data.error.issues) issues.push(`blocks.${index}.data.${formatIssue(issue)}`)
          return
        }
        parsed.push({ ...block, data: data.data as Record<string, unknown> })
      })
      return issues.length ? { ok: false, issues } : { ok: true, data: { seo: shape.data.seo, blocks: parsed } }
    },
  }
}

function formatIssue(issue: z.core.$ZodIssue): string {
  return `${issue.path.join(".") || "(root)"}: ${issue.message}`
}

/** Payload a site sends to the panel on deploy (POST /api/content/v1/schema). */
export function exportSchemas(registry: Registry) {
  return Object.entries(registry.blocks).map(([type, definition]) => ({
    type,
    version: definition.version,
    title: definition.title,
    json_schema: z.toJSONSchema(definition.schema, { io: "input" }),
  }))
}
