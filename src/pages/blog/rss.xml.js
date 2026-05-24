import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET( context ) {
    const posts = ( await getCollection( 'blog', ( { data } ) => !data.draft ) )
        .sort( ( a, b ) => b.data.date.valueOf() - a.data.date.valueOf() )

    return rss( {
        title: 'FlowMCP Blog',
        description: 'Releases, hackathon stories, integration guides.',
        site: context.site ?? 'https://flowmcp.github.io',
        items: posts.map( ( post ) => ( {
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.date,
            author: post.data.author,
            link: `/blog/${post.id}/`
        } ) ),
        customData: '<language>en-us</language>'
    } )
}
