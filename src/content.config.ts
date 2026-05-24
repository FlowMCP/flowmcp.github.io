import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

const docs = defineCollection( {
    loader: docsLoader(),
    schema: docsSchema()
} )

const blog = defineCollection( {
    loader: glob( { pattern: '**/*.{md,mdx}', base: './src/content/blog' } ),
    schema: z.object( {
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        author: z.string().default( 'FlowMCP Team' ),
        tags: z.array( z.string() ).default( [] ),
        cover: z.string().optional(),
        draft: z.boolean().default( false )
    } )
} )

export const collections = { docs, blog }
