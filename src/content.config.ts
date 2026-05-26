import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

const docs = defineCollection( {
    loader: docsLoader(),
    schema: docsSchema()
} )

// Memo 060 PRD-004: Blog-Collection wird Starlight-konform gemacht.
// docsSchema({extend: ...}) mergt unser Custom-Schema mit dem Starlight-
// Built-in-Schema, damit Starlight die Blog-Posts wie Docs-Pages rendern
// kann (via <StarlightPage>-Wrapper in src/layouts/BlogPostLayout.astro,
// siehe PRD-005). Custom-Felder (date, author, tags, cover, draft) bleiben
// erhalten und werden auf den Posts weiterhin validiert.
const blog = defineCollection( {
    loader: glob( { pattern: '**/*.{md,mdx}', base: './src/content/blog' } ),
    schema: docsSchema( {
        extend: z.object( {
            date: z.coerce.date(),
            author: z.string().default( 'FlowMCP Team' ),
            tags: z.array( z.string() ).default( [] ),
            cover: z.string().optional(),
            draft: z.boolean().default( false ),
            lang: z.enum( [ 'en', 'de' ] ).default( 'en' )
        } )
    } )
} )

export const collections = { docs, blog }
