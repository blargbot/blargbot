import { GlobalCommand } from '../../command/index.js';
import { CommandType, shuffle } from '@blargbot/cluster/utils/index.js';
import { mapping } from '@blargbot/mapping';
import fetch from 'node-fetch';
import xml2js from 'xml2js';

import templates from '../../text.js';
import { CommandResult } from '../../types.js';

const cmd = templates.commands.rule34;

export class Rule34Command extends GlobalCommand {
    public constructor() {
        super({
            name: 'rule34',
            aliases: ['r34'],
            category: CommandType.NSFW,
            definitions: [
                {
                    parameters: '{tags[]}',
                    description: cmd.default.description,
                    execute: (_, [tags]) => this.getRule34(tags.asStrings)
                }
            ]
        });
    }

    public async getRule34(tags: readonly string[]): Promise<CommandResult> {
        if (tags.length === 0)
            return cmd.default.noTags;

        tags = tags
            .filter(t => !/[^a-zA-Z0-9_-]/.test(t))
            .filter(t => !/loli|shota|child|young/i.test(t))
            .map(t => t.toLowerCase());

        if (tags.length === 0)
            return cmd.default.unsafeTags;

        const response = await requestXmlSafe(`http://rule34.paheal.net/api/danbooru/find_posts/index.xml?tags=${tags.join('%20')}&limit=50`);
        const doc = r34Mapping(response);
        if (!doc.valid)
            return cmd.default.noResults;

        const posts = doc.value.posts.tag
            .map(t => t.$)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (posts.length === 0)
            return cmd.default.noResults;

        shuffle(posts);
        const selected = posts.slice(0, 3);

        return {
            content: cmd.default.success({ count: selected.length, total: posts.length, tags }),
            embeds: selected.map(post => ({
                author: {
                    name: cmd.default.embed.author.name({ author: post.author }),
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
