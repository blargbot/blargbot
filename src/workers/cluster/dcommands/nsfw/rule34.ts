import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, mapping, shuffle } from '@cluster/utils';
import { humanize } from '@core/utils';
import { MessageOptions } from 'discord.js';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

export class Rule34Command extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'rule34',
            aliases: ['r34'],
            category: CommandType.NSFW,
            definitions: [
                {
                    parameters: '{tags[]}',
                    description: 'Gets three pictures from \'<https://rule34.xxx/>\' using given tags.',
                    execute: (_, [tags]) => this.getRule34(tags)
                }
            ]
        });
    }

    public async getRule34(tags: string[]): Promise<string | MessageOptions> {
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

        const urls = doc.value.posts.tag
            .map(t => t.$)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (urls.length === 0)
            return this.error('No results were found');

        shuffle(urls);

        const selected = urls.slice(0, 3);

        return {
            content: `Found **${urls.length}/50** posts for tags ${humanize.smartJoin(tags.map(t => `\`${t}\``), ', ', ' and ')}`,
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
const r34Mapping = mapping.mapObject({
    posts: mapping.mapObject({
        tag: mapping.mapArray(mapping.mapObject({
            '$': mapping.mapObject({
                author: mapping.mapOptionalString,
                file_url: mapping.mapOptionalString,
                date: mapping.mapOptionalDate,
                source: mapping.mapOptionalString
            })
        }))
    })
});
/* eslint-enable @typescript-eslint/naming-convention */
