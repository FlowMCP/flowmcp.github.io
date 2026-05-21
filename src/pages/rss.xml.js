import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
    const posts = (await getCollection('docs', ({ id }) => id.startsWith('blog/') && id !== 'blog/index'));

    return rss({
        title: 'FlowMCP Blog',
        description: 'Releases, hackathon stories, integration guides.',
        site: context.site ?? 'https://flowmcp.github.io',
        items: posts.map((post) => ({
            title: post.data.title,
            description: post.data.description,
            link: `/${post.id}/`,
        })),
        customData: '<language>en-us</language>',
    });
}
