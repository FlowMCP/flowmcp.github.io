import { defineCollection, z } from 'astro:content'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'


// PRD-01 (Memo 052): Zod-Erweiterung fuer Doku-Payload-Frontmatter.
// Spec-Files unter src/content/docs/specification/ stammen aus dem
// Auto-Gen-Payload (flowmcp-spec/generated/docs-payload/). Diese Files
// fuehren zusaetzliche Frontmatter-Felder (spec_version, spec_file, order,
// section, normative, generated_at, generated_from, generator, edit_warning,
// pagefind, related, codes_referenced, spec_quality). Starlight 'docs'
// schema muss dafuer geoeffnet werden, damit der Build nicht bricht.
const specFrontmatterExtension = z.object( {
    spec_version: z.string().optional(),
    spec_file: z.string().optional(),
    order: z.number().optional(),
    section: z.string().optional(),
    normative: z.boolean().optional(),
    generated_at: z.string().optional(),
    generated_from: z.string().optional(),
    generator: z.string().optional(),
    edit_warning: z.string().optional(),
    tags: z.array( z.string() ).optional(),
    pagefind: z.object( {
        customMeta: z.object( {
            section: z.string()
        } )
    } ).optional(),
    related: z.array( z.string() ).optional(),
    codes_referenced: z.array( z.string() ).optional(),
    spec_quality: z.object( {
        grade: z.number().min( 1 ).max( 5 ),
        issues: z.number(),
        evaluated_at: z.string().optional()
    } ).optional()
} )


export const collections = {
    docs: defineCollection( {
        loader: docsLoader(),
        schema: docsSchema( { extend: specFrontmatterExtension } )
    } )
}
