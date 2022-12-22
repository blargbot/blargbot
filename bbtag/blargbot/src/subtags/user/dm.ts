import { BBTagRuntimeError, UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';

export class DMSubtag extends Subtag {
    readonly #dmCache: DMCache = {};

    public constructor() {
        super({
            name: 'dm',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user', 'message'],
                    description: tag.text.description,
                    exampleCode: tag.text.exampleCode,
                    exampleOut: tag.text.exampleOut
                },
                {
                    parameters: ['user', 'embed'],
                    description: tag.embed.description,
                    exampleCode: tag.embed.exampleCode,
                    exampleOut: tag.embed.exampleOut
                },
                {
                    parameters: ['user', 'content'],
                    returns: 'nothing',
                    execute: (ctx, [user, content]) => this.sendDm(ctx, user.value, content.value, undefined)
                },
                {
                    parameters: ['user', 'message', 'embed'],
                    description: tag.full.description,
                    exampleCode: tag.full.exampleCode,
                    exampleOut: tag.full.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [user, message, embed]) => this.sendDm(ctx, user.value, message.value, embed.value)
                }
            ]
        });
    }

    public async sendDm(
        context: BBTagContext,
        userStr: string,
        messageStr: string,
        embedStr?: string
    ): Promise<void> {
        const member = await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const messageAsEmbeds = embedStr === undefined ? parse.embed(messageStr, false) : undefined;
        const embeds = messageAsEmbeds ?? parse.embed(embedStr);
        const content = messageAsEmbeds === undefined ? messageStr : undefined;

        try {
            let cache = this.#dmCache[member.id];
            const channel = await member.user.getDMChannel();
            if (cache === undefined ||
                cache.count > 5 ||
                cache.user !== context.user.id ||
                cache.guild !== context.guild.id) {
                // Ew we're gonna send a message first? It was voted...
                // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
                await context.util.send(channel, { content: `The following message was sent from **__${context.guild.name}__** (${context.guild.id}), and was sent by **__${context.user.username}#${context.user.discriminator}__** (${context.user.id}):` });
                cache = this.#dmCache[member.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
            }

            context.data.nsfw === undefined
                ? await context.util.send(channel, { content, embeds })
                : await context.util.send(channel, { content: context.data.nsfw });
            cache.count++;
        } catch (e: unknown) {
            context.logger.error('DM failed', e);
            throw new BBTagRuntimeError('Could not send DM');
        }
    }
}

interface DMCache {
    [index: string]: {
        guild: string;
        count: number;
        user: string;
    } | undefined;
}
