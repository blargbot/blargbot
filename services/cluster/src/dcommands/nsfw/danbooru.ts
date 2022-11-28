import { GlobalCommand } from '../../command/index';
import { CommandType, shuffle } from '@blargbot/cluster/utils';
import { mapping } from '@blargbot/mapping';
import fetch from 'node-fetch';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.danbooru;

export class DanbooruCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'danbooru',
            category: CommandType.NSFW,
            definitions: [
                {
                    parameters: '{tags[]}',
                    description: cmd.default.description,
                    execute: (_, [tags]) => this.getDanbooru(tags.asStrings)
                }
            ]
        });
    }

    public async getDanbooru(tags: readonly string[]): Promise<CommandResult> {
        if (tags.length === 0)
            return cmd.default.noTags;

        tags = tags
            .filter(t => !/[^a-zA-Z0-9_-]/.test(t))
            .filter(t => !/loli|shota|child|young/i.test(t))
            .map(t => t.toLowerCase());

        if (tags.length === 0)
            return cmd.default.unsafeTags;

        const response = await requestSafe(`https://danbooru.donmai.us/posts.json?limit=50&tags=${tags.join('%20')}`);
        const doc = danbooruMapping(response);
        if (!doc.valid)
            return cmd.default.noResults;

        const posts = doc.value
            .filter(p => p.has_children === false)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (posts.length === 0)
            return cmd.default.noResults;

        shuffle(posts);
        const selected = posts.slice(0, 3);

        return {
            content: cmd.default.success({ count: selected.length, total: posts.length, tags }),
            embeds: selected.map(post => ({
                author: {
                    name: cmd.default.embed.author.name({ author: post.tag_string_artist }),
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
