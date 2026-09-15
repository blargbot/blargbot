import type { CommandContext } from '@blargbot/cluster';
import { CommandType, GlobalCommand } from '@blargbot/cluster';
import { random } from '@blargbot/util';
import z from 'zod';

import { templates } from '../../text.js';
import type { CommandResult } from '../../types.js';

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
                    execute: (ctx, [tags]) => this.getDanbooru(tags.asStrings, ctx)
                }
            ]
        });
    }

    public async getDanbooru(tags: readonly string[], context: CommandContext): Promise<CommandResult> {
        if (tags.length === 0)
            return cmd.default.noTags;

        tags = tags
            .filter(t => !/[^a-zA-Z0-9_-]/.test(t))
            .filter(t => !/loli|shota|child|young/i.test(t))
            .map(t => t.toLowerCase());

        if (tags.length === 0)
            return cmd.default.unsafeTags;

        const response = await this.#requestSafe(`https://danbooru.donmai.us/posts.json?limit=50&tags=${tags.join('%20')}`, context);
        const doc = danbooruMapping.safeParse(response);
        if (!doc.success)
            return cmd.default.noResults;

        const posts = doc.data
            .filter(p => p.has_children === false)
            .filter(p => p.file_url !== undefined && /\.(gif|jpg|png|jpeg)$/.test(p.file_url));

        if (posts.length === 0)
            return cmd.default.noResults;

        random.ishuffle(posts);
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

    async #requestSafe(url: string, context: CommandContext): Promise<unknown> {
        try {
            const response = await context.util.fetch(url);
            return await response.json();
        } catch {
            return undefined;
        }
    }
}

const danbooruMapping = z.object({
    has_children: z.boolean().optional(),
    file_url: z.string().optional(),
    tag_string_artist: z.string().optional(),
    source: z.string().optional(),
    created_at: z.date().optional()
}).array();
