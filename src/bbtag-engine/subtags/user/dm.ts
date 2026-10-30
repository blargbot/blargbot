import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { RwLock } from '../../getLock.js';
import { templates } from '../../text.js';
import { convertToEmbed } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import type { GetGuildNameFeature } from '../guild/guildName.js';
import type { SendFeature } from '../message/send.js';
import { UserIdSubtag } from './userId.js';
import type { GetUserNameFeature } from './userName.js';

const tag = templates.subtags.dm;

export interface GetDmChannelIdFeature {
    getDmChannelId(userId: string): Promise<string | undefined>;
}

type Features = GetDmChannelIdFeature & SendFeature & GetUserNameFeature & GetGuildNameFeature
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
        const targetId = await UserIdSubtag.query(context, userStr)
            ?? new UserNotFoundError(userStr).throw();

        const messageAsEmbeds = embedStr === undefined ? convertToEmbed(messageStr, false) : undefined;
        let embeds = messageAsEmbeds ?? convertToEmbed(embedStr);
        let content = messageAsEmbeds === undefined ? messageStr : undefined;
        if (context.root.output.nsfw !== undefined) {
            content = context.root.output.nsfw;
            embeds = undefined;
        }
        const guildId = context.root.guildId;
        const userId = context.root.userId;
        const cache = this.#dmCache.getOrInsertComputed(targetId, () => ({ count: 0, lock: new RwLock() }));
        const channelId = await this.#features.getDmChannelId(targetId)
            ?? new UserNotFoundError(userStr).throw();
        await using _handle = await cache.lock.enterWrite();
        if (cache.count === 0 || cache.count >= 5 || cache.sender !== userId || cache.guild !== guildId) {
            // Ew we're gonna send a message first? It was voted...
            // TODO: Maybe change to a footer embed on every DM? I dont think its possible to disable embeds in DMs
            const guildName = await this.#features.getGuildName(guildId) ?? 'deleted.guild';
            const userName = await this.#features.getUserName(userId) ?? 'deleted.user';
            await this.#features.sendMessage(channelId, { content: `The following message was sent from **__${guildName}__** (${guildId}), and was sent by **__@${userName}__** (${userId}):` });
            cache.sender = userId;
            cache.guild = guildId;
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
