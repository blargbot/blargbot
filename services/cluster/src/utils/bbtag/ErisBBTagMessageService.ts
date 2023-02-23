import type { AwaitReactionsResponse, BBTagContext, Entities, MessageService } from '@bbtag/blargbot';
import { catchErrors } from '@blargbot/catch-decorators';
import type { Emote } from '@blargbot/discord-emote';
import { AllowedMentionsTypes } from 'discord-api-types/v10';
import * as Eris from 'eris';

import type { Cluster } from '../../Cluster.js';

export class ErisBBTagMessageService implements MessageService {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
    }

    #convertToMessage(message: Eris.Message): Entities.Message {
        throw message;
    }

    public async get(context: BBTagContext, channelId: string, messageId: string): Promise<Entities.Message | undefined> {
        if (channelId === context.channel.id && (messageId === context.message.id || messageId === ''))
            return context.message;

        const message = await this.#cluster.util.getMessage(channelId, messageId);
        if (message === undefined)
            return undefined;

        return this.#convertToMessage(message);
    }

    @catchErrors.async.filtered(err => err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.UNKNOWN_MESSAGE, () => undefined)
    public async delete(context: BBTagContext, channelId: string, messageId: string): Promise<void> {
        await this.#cluster.discord.deleteMessage(channelId, messageId, context.auditReason());
    }

    @catchErrors.async.filtered(() => true, () => undefined)
    public async edit(_context: BBTagContext, channelId: string, messageId: string, content: Partial<Entities.MessageCreateOptions>): Promise<void> {
        // @ts-expect-error This is only a reference file for now
        await this.#cluster.discord.editMessage(channelId, messageId, content);
    }

    @catchErrors.async(Eris.DiscordRESTError, err => ({ error: err.message }))
    @catchErrors.async.filtered(() => true, () => ({ error: 'UNKNOWN' }))
    public async create(context: BBTagContext, channelId: string, content: Entities.MessageCreateOptions): Promise<Entities.Message | { error: string; } | undefined> {
        if (content.allowed_mentions?.parse !== undefined) {
            const everyoneIndex = content.allowed_mentions.parse.indexOf(AllowedMentionsTypes.Everyone);
            if (everyoneIndex !== -1 && await this.#cluster.database.guilds.getSetting(context.guild.id, 'disableeveryone') === true)
                content.allowed_mentions.parse.splice(everyoneIndex, 1);
        }

        const message = context.data.nsfw === undefined
            // @ts-expect-error This is only a reference file for now
            ? await this.#cluster.discord.createMessage(channelId, content)
            : await this.#cluster.discord.createMessage(channelId, {
                content: context.data.nsfw,
                allowedMentions: content.allowed_mentions,
                // @ts-expect-error This is only a reference file for now
                messageReference: content.message_reference
            });

        return this.#convertToMessage(message);
    }

    @catchErrors.async(Eris.DiscordHTTPError, err => ({ error: err.message }))
    @catchErrors.async(Eris.DiscordRESTError, err => ({ error: err.message }))
    @catchErrors.async.filtered(() => true, () => ({ error: 'UNKNOWN' }))
    public async runWebhook(_context: BBTagContext, webhookId: string, webhookToken: string, content: Entities.WebhookCreateOptions): Promise<{ error: string; } | undefined> {
        // @ts-expect-error This is only a reference file for now
        await this.#cluster.discord.executeWebhook(webhookId, webhookToken, content);
        return undefined;
    }

    public async addReactions(_context: BBTagContext, channelId: string, messageId: string, reactions: Emote[]): Promise<{ success: Emote[]; failed: Emote[]; }> {
        return await this.#cluster.util.addReactions({ id: messageId, channel: { id: channelId } }, reactions);
    }

    public async removeReactions(context: BBTagContext, channelId: string, messageId: string): Promise<void>;
    public async removeReactions(context: BBTagContext, channelId: string, messageId: string, userId: string, reactions: Emote[]): Promise<'noPerms' | { success: Emote[]; failed: Emote[]; }>;
    public async removeReactions(context: BBTagContext, channelId: string, messageId: string, userId?: string, reactions?: Emote[]): Promise<'noPerms' | { success: Emote[]; failed: Emote[]; } | void> {
        if (userId === undefined || reactions === undefined) {
            await this.#cluster.discord.removeMessageReactions(channelId, messageId);
            return;
        }

        const result = { failed: [] as Emote[], success: [] as Emote[] };
        for (const reaction of reactions) {
            try {
                await context.limit.check(context, 'reactremove:requests');
                await this.#cluster.discord.removeMessageReaction(channelId, messageId, reaction.toApi(), userId);
                result.success.push(reaction);
            } catch (err: unknown) {
                if (!(err instanceof Eris.DiscordRESTError))
                    throw err;

                switch (err.code) {
                    case Eris.ApiError.UNKNOWN_EMOJI:
                        result.failed.push(reaction);
                        break;
                    case Eris.ApiError.MISSING_PERMISSIONS:
                        return 'noPerms';
                    default:
                        throw err;
                }
            }
        }

        return result;

    }

    @catchErrors.async.filtered(err => err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.UNKNOWN_EMOJI, () => 'unknownEmote' as const)
    public async getReactors(_context: BBTagContext, channelId: string, messageId: string, reaction: Emote): Promise<string[] | 'unknownEmote'> {
        const result = await this.#cluster.discord.getMessageReaction(channelId, messageId, reaction.toApi());
        return result.map(u => u.id);
    }

    public async awaitReaction(_context: BBTagContext, messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined> {
        return await this.#cluster.awaiter.reactions.getAwaiter(messages, filter, timeoutMs).wait();
    }

    public async awaitMessage(_context: BBTagContext, channels: string[], filter: (message: Entities.Message) => Awaitable<boolean>, timeoutMs: number): Promise<Entities.Message | undefined> {
        const result = await this.#cluster.awaiter.messages.getAwaiter(channels, msg => filter(this.#convertToMessage(msg)), timeoutMs).wait();
        if (result === undefined)
            return undefined;
        return this.#convertToMessage(result);
    }

}
