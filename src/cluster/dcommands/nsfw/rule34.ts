import { GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, shuffle } from '@blargbot/cluster/utils';
import { SendContent } from '@blargbot/core/types';
import { humanize } from '@blargbot/core/utils';
import { mapping } from '@blargbot/mapping';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

export class Rule34Command extends GlobalCommand {
    public constructor() {
        super({
            name: 'rule34',
            aliases: ['r34'],
            category: CommandType.NSFW,
            definitions: [
                {
                    parameters: '{tags[]}',
                    description: 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.',
                    execute: (_, [tags]) => this.getRule34(tags.asStrings)
                }
            ]
        });
    }

    public async getRule34(tags: readonly string[]): Promise<string | SendContent> {
        if (tags.length === 0)
            return this.error('You need to provide some tags');

        const safeTags = tags
            .filter(t => !/[^a-zA-Z0-9_-]/.test(t))
            .filter(t => !/loli|shota|child|young/i.test(t))
            .map(t => t.toLowerCase());

        if (safeTags.length === 0)
            return this.error('None of the tags you provided were safe!');

        const response = await requestXmlSafe(`http://rule34.paheal.net/api/danbooru/find_posts/index.xml?tags=${tags.join('%20')}&limit=50`);
        const doc = r34Mapping(response);
        if (!doc.valid)
            return this.error('No results were found!');

        const posts = doc.value.posts.tag
            .map(t => t.$)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (posts.length === 0)
            return this.error('No results were found');

        shuffle(posts);

        const selected = posts.slice(0, 3);

        return {
            content: `Found **${posts.length}/50** posts for tags ${humanize.smartJoin(tags.map(t => `\`${t}\``), ', ', ' and ')}`,
            embeds: selected.map(post => ({
                author: {
                    name: `By ${post.author ?? 'UNKNOWN'}`,
                    url: post.source
                },
                image: { url: post.file_url },
                timestamp: post.date
            }))
        };
    }
}

async function requestXmlSafe(url: string): Promise<unknown> {
    try {
        const response = await fetch(url);
        return await xml2js.parseStringPromise(await response.text()) as unknown;
    } catch {
        return undefined;
    }
}

/* eslint-disable @typescript-eslint/naming-convention */
const r34Mapping = mapping.object({
    posts: mapping.object({
        tag: mapping.array(mapping.object({
            '$': mapping.object({
                author: mapping.string.optional,
                file_url: mapping.string.optional,
                date: mapping.date.optional,
                source: mapping.string.optional
            })
        }))
    })
});
/* eslint-enable @typescript-eslint/naming-convention */
