import { BaseGlobalCommand } from '@cluster/command';
import { CommandType, humanize, mapping, shuffle } from '@cluster/utils';
import { MessageOptions } from 'discord.js';
import fetch from 'node-fetch';

export class DanbooruCommand extends BaseGlobalCommand {
    public constructor() {
        super({
            name: 'danbooru',
            category: CommandType.NSFW,
            definitions: [
                {
                    parameters: '{tags[]}',
                    description: 'Gets three pictures from \'<https://danbooru.donmai.us/>\' using given tags.',
                    execute: (_, [tags]) => this.getDanbooru(tags.asStrings)
                }
            ]
        });
    }

    public async getDanbooru(tags: readonly string[]): Promise<string | MessageOptions> {
        if (tags.length === 0)
            return this.error('You need to provide some tags');

        const safeTags = tags
            .filter(t => !/[^a-zA-Z0-9_-]/.test(t))
            .filter(t => !/loli|shota|child|young/i.test(t))
            .map(t => t.toLowerCase());

        if (safeTags.length === 0)
            return this.error('None of the tags you provided were safe!');

        const response = await requestSafe(`https://danbooru.donmai.us/posts.json?limit=50&tags=${tags.join('%20')}`);
        const doc = danbooruMapping(response);
        if (!doc.valid)
            return this.error('No results were found!');

        const posts = doc.value
            .filter(p => p.has_children === false)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (posts.length === 0)
            return this.error('No results were found!');

        shuffle(posts);

        const selected = posts.slice(0, 3);
        return {
            content: `Found **${posts.length}/50** posts for tags ${humanize.smartJoin(tags.map(t => `\`${t}\``), ', ', ' and ')}`,
            embeds: selected.map(post => ({
                author: {
                    name: `By ${post.tag_string_artist ?? 'UNKNOWN'}`,
                    url: post.source
                },
                image: { url: post.file_url },
                timestamp: post.created_at
            }))
        };
    }
}

async function requestSafe(url: string): Promise<unknown> {
    try {
        const response = await fetch(url);
        return await response.json() as unknown;
    } catch (err: unknown) {
        return undefined;
    }
}

/* eslint-disable @typescript-eslint/naming-convention */
const danbooruMapping = mapping.array(mapping.object({
    has_children: mapping.boolean.optional,
    file_url: mapping.string.optional,
    tag_string_artist: mapping.string.optional,
    source: mapping.string.optional,
    created_at: mapping.date.optional
}));
/* eslint-enable @typescript-eslint/naming-convention */
