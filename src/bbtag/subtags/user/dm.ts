import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { RwLock } from '../../getLock.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { SendThunk } from '../message/send.js';

const tag = templates.subtags.dm;

export class DMSubtag extends CompiledSubtag {
    readonly #dmCache = new Map<string, DMCacheEntry>();
    readonly #send: SendThunk;
    public constructor({ send }: { send: SendThunk; }) {
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
        this.#send = send;
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
        let embeds = messageAsEmbeds ?? parse.embed(embedStr);
        let content = messageAsEmbeds === undefined ? messageStr : undefined;
        if (context.root.output.nsfw !== undefined) {
            content = context.root.output.nsfw;
            embeds = undefined;
        }
        const guild = context.root.message.channel.guild;
        const user = context.root.message.author;
        const cache = this.#dmCache.getOrInsertComputed(member.id, () => ({ count: 0, lock: new RwLock() }));
        const channel = await member.user.getDMChannel();
        await using _handle = await cache.lock.enterWrite();
        if (cache.count === 0 || cache.count >= 5 || cache.sender !== user.id || cache.guild !== guild.id) {
            // Ew we're gonna send a message first? It was voted...
            // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
            await this.#send(channel.id, { content: `The following message was sent from **__${guild.name}__** (${guild.id}), and was sent by **__${user.username}#${user.discriminator}__** (${user.id}):` });
            cache.sender = user.id;
            cache.guild = guild.id;
            cache.count = 0;
        }

        const result = await this.#send(channel.id, { content, embeds });
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
