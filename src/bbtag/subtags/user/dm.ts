import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { RwLock } from '../../getLock.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { SendFeature } from '../message/send.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.dm;

export interface GetDmChannelIdFeature {
    getDmChannelId(userId: string): Promise<string | undefined>;
}

type Features = GetDmChannelIdFeature & SendFeature
export class DMSubtag extends CompiledSubtag {
    readonly #dmCache = new Map<string, DMCacheEntry>();
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async sendDm(
        context: BBTagContext,
        userStr: string,
        messageStr: string,
        embedStr?: string
    ): Promise<void> {
        const userId = await UserIdSubtag.query(context, userStr)
            ?? new UserNotFoundError(userStr).throw();

        const messageAsEmbeds = embedStr === undefined ? parse.embed(messageStr, false) : undefined;
        let embeds = messageAsEmbeds ?? parse.embed(embedStr);
        let content = messageAsEmbeds === undefined ? messageStr : undefined;
        if (context.root.output.nsfw !== undefined) {
            content = context.root.output.nsfw;
            embeds = undefined;
        }
        const guild = context.root.message.channel.guild;
        const user = context.root.message.author;
        const cache = this.#dmCache.getOrInsertComputed(userId, () => ({ count: 0, lock: new RwLock() }));
        const channelId = await this.#features.getDmChannelId(userId)
            ?? new UserNotFoundError(userStr).throw();
        await using _handle = await cache.lock.enterWrite();
        if (cache.count === 0 || cache.count >= 5 || cache.sender !== user.id || cache.guild !== guild.id) {
            // Ew we're gonna send a message first? It was voted...
            // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
            await this.#features.sendMessage(channelId, { content: `The following message was sent from **__${guild.name}__** (${guild.id}), and was sent by **__${user.username}#${user.discriminator}__** (${user.id}):` });
            cache.sender = user.id;
            cache.guild = guild.id;
            cache.count = 0;
        }

        const result = await this.#features.sendMessage(channelId, { content, embeds });
        if (!result.success)
            throw new BBTagRuntimeError('Could not send DM');
        cache.count++;
    }
}

interface DMCacheEntry {
    count: number;
    guild?: string;
    sender?: string;
    readonly lock: RwLock;
}
