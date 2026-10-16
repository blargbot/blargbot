import type { BBTagSendContent, BBTagUtilities, ReactionEvent, RwLock, SerializedBBTagContext, subtags } from '@blargbot/bbtag';
import { getLock } from '@blargbot/bbtag';
import type { DumpOptions, ExecuteWebhookPayload, ExecuteWebhookResult, SendPayload, SendResult } from '@blargbot/bbtag/subtags';
import { type ChoiceQueryResult, type Emote, type EntityPickQueryOptions, type SendContent, snowflake } from '@blargbot/core';
import type { GuildCommandTag, StoredTag, TagVariableScope } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import type { Logger } from '@blargbot/logger';
import { raceAsyncIterable, sleep, usingTimeout } from '@blargbot/util';
import * as eris from 'eris';
import type moment from 'moment-timezone';

import { bindAll } from './bindAll.js';
import type { Cluster } from './Cluster.js';
import { guard } from './utils/index.js';

type SubtagConstructorArgs = typeof subtags[keyof typeof subtags] extends new (arg: infer R) => unknown ? R : never;
@bindAll
export class ClusterSubtagConstructorArgs implements SubtagConstructorArgs {
    readonly #cluster: Cluster;

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
    }

    public get defaultPrefix(): string {
        return this.#cluster.config.discord.defaultPrefix;
    };
    public get logger(): Logger {
        return this.#cluster.logger;
    }
    public async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
        return await this.#cluster.fetch(input, init);
    }
    public getLock(scope: TagVariableScope | undefined, name: string): RwLock {
        return getLock(scope, name);
    }
    public async sleep(delay: number, signal?: AbortSignal): Promise<void> {
        return await sleep(delay, signal);
    }
    public canRequestDomain(domain: string): Promise<boolean> {
        return Promise.resolve(this.#cluster.domains.isWhitelisted(domain));
    }
    public async getTag(name: string): Promise<StoredTag | undefined> {
        return await this.#cluster.database.tags.get(name);
    }
    public async getCustomCommand(guildId: string, name: string): Promise<GuildCommandTag | undefined> {
        return await this.#cluster.database.guilds.getCommand(guildId, name);
    }
    public async getWarnings(guildId: string, userId: string): Promise<number | undefined> {
        return await this.#cluster.database.guilds.getWarnings(guildId, userId);
    }
    public async getUserTimezone(userId: string): Promise<string | undefined> {
        return await this.#cluster.database.users.getProp(userId, 'timezone');
    }
    public async getPrefix(guildId: string): Promise<readonly string[] | undefined> {
        return await this.#cluster.database.guilds.getSetting(guildId, 'prefix');
    }
    public async canPingEveryone(guildId: string): Promise<boolean> {
        return await this.#cluster.database.guilds.getSetting(guildId, 'disableeveryone') !== true;
    }
    public async generateDumpLink(options: DumpOptions): Promise<URL> {
        const id = await this.#cluster.util.generateDumpPage({ content: options.content }, snowflake.parse(options.channelId));
        return new URL(this.#cluster.util.websiteLink(`dumps/${id}`));
    }
    public async executeWebhook(webhookId: string, webhookToken: string, payload: ExecuteWebhookPayload): Promise<ExecuteWebhookResult> {
        try {
            await this.#cluster.discord.executeWebhook(webhookId, webhookToken, payload);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async send(channelId: string, payload: SendPayload): Promise<SendResult> {
        try {
            const channel = this.#cluster.discord.getChannel(channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found.' };
            if (!guard.isTextableChannel(channel))
                return { success: false, reason: 'Channel cannot receive messages.' };
            const message = await this.#cluster.util.send(channel, util.literal({
                content: payload.content,
                embeds: payload.embeds,
                file: payload.files,
                allowedMentions: payload.allowedMentions !== undefined ? {
                    everyone: payload.allowedMentions.everyone,
                    roles: [...payload.allowedMentions.roles],
                    users: [...payload.allowedMentions.users]
                } : undefined
            }));
            if (message === undefined)
                return { success: false };
            return { success: true, id: message.id };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async addReactions(channelId: string, messageId: string, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
        const channel = this.#cluster.discord.getChannel(channelId);
        if (channel === undefined || !guard.isTextableChannel(channel))
            return { success: [], failed: [...reactions] };
        let message;
        try {
            message = channel.messages.get(messageId) ?? await channel.getMessage(messageId);
        } catch {
            return { success: [], failed: [...reactions] };
        }

        return await this.#cluster.util.addReactions(message, reactions);
    }
    public async schedule(context: SerializedBBTagContext, code: string, timestamp: Temporal.Instant): Promise<void> {
        const channel = context.msg.channel.id;
        const guild = this.#cluster.discord.channelGuildMap[channel];
        await this.#cluster.timeouts.insert('tag', {
            version: 4,
            source: guild,
            channel: channel,
            endtime: timestamp.epochMilliseconds,
            context: JSON.stringify(context),
            content: code
        });
    }
    public async* streamReactions(messageIds: Iterable<string>, timeoutMs: number): AsyncIterable<ReactionEvent> {
        const abort = new AbortController();
        using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
        const partitions = Iterator.from(messageIds).map(x => this.#cluster.awaiter.reactions.getPartition(x));
        yield* raceAsyncIterable(partitions, abort.signal);
    }
    public async* streamMessages(channelIds: Iterable<string>, timeoutMs: number): AsyncIterable<eris.KnownMessage> {
        const abort = new AbortController();
        using _onTimeout = usingTimeout(() => abort.abort(), timeoutMs);
        const partitions = Iterator.from(channelIds).map(x => this.#cluster.awaiter.messages.getPartition(x));
        yield* raceAsyncIterable(partitions, abort.signal);
    }

    #handleError(error: unknown): { success: false; reason?: string; } {
        if (error instanceof eris.DiscordHTTPError || error instanceof eris.DiscordRESTError)
            return { success: false, reason: error.message };

        if (!(error instanceof Error)) {
            const e = error = new Error(String(error));
            Error.captureStackTrace(e, this.#handleError);
        }
        this.#cluster.logger.error(error);
        return { success: false };
    }
}

export class ClusterBBTagUtilities implements BBTagUtilities {
    public constructor(public readonly cluster: Cluster) {
    }

    public async send<T extends eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: eris.User): Promise<eris.Message<T> | undefined> {
        return payload.nsfw !== undefined && guard.isGuildChannel(channel) && !channel.nsfw
            ? await this.cluster.util.send(channel, util.literal({ content: payload.nsfw, allowedMentions: payload.allowedMentions }))
            : await this.cluster.util.send(channel, util.literal(payload), author);
    }

    public async getChannel(channelId: string): Promise<eris.KnownChannel | undefined>;
    public async getChannel(guild: string | eris.Guild, channelId: string): Promise<eris.KnownGuildChannel | undefined>;
    public async getChannel(...args: [string] | [string | eris.Guild, string]): Promise<eris.KnownChannel | undefined> {
        return args.length === 1
            ? await this.cluster.util.getChannel(...args)
            : await this.cluster.util.getChannel(...args);
    }

    public async findChannels(guild: string | eris.Guild, query?: string): Promise<eris.KnownGuildChannel[]> {
        return await this.cluster.util.findChannels(guild, query);
    }

    public async ensureMemberCache(guild: eris.Guild): Promise<void> {
        return await this.cluster.util.ensureMemberCache(guild);
    }

    public async getMember(guild: string | eris.Guild, userId: string): Promise<eris.Member | undefined> {
        return await this.cluster.util.getMember(guild, userId);
    }

    public async findMembers(guild: string | eris.Guild, query?: string): Promise<eris.Member[]> {
        return await this.cluster.util.findMembers(guild, query);
    }

    public async getUser(userId: string): Promise<eris.User | undefined> {
        return await this.cluster.util.getUser(userId);
    }

    public async getRole(guild: string | eris.Guild, roleId: string): Promise<eris.Role | undefined> {
        return await this.cluster.util.getRole(guild, roleId);
    }

    public async findRoles(guild: string | eris.Guild, query?: string): Promise<eris.Role[]> {
        return await this.cluster.util.findRoles(guild, query);
    }

    public async getMessage(channel: string, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>;
    public async getMessage(channel: eris.KnownChannel, messageId: string, force?: boolean): Promise<eris.KnownMessage | undefined>;
    public async getMessage(...args: [eris.KnownChannel, string, boolean?] | [string, string, boolean?]): Promise<eris.KnownMessage | undefined> {
        return isIndex0String(args)
            ? await this.cluster.util.getMessage(...args)
            : await this.cluster.util.getMessage(...args);
    }

    public async getBannedUsers(guild: eris.Guild): Promise<string[]> {
        await this.cluster.util.ensureGuildBans(guild);
        const bans = this.cluster.util.getGuildBans(guild);
        return [...bans];
    }

    public timeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, duration: moment.Duration, reason?: string): Promise<'noPerms' | 'success' | 'alreadyTimedOut' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        return this.cluster.moderation.timeouts.timeout(member, moderator, authorizer, duration, util.literal(reason));
    }

    public clearTimeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notTimedOut'> {
        return this.cluster.moderation.timeouts.clearTimeout(member, moderator, authorizer, util.literal(reason));
    }

    public addModLog(guild: eris.Guild, action: string, user: eris.User, moderator?: eris.User, reason?: string, color?: number): Promise<void> {
        return this.cluster.moderation.modLog.logCustom(guild, util.literal(action), user, moderator, util.literal(reason), color);
    }

    public isUserStaff(member: eris.Member): Promise<boolean> {
        return this.cluster.util.isUserStaff(member);
    }

    public queryMember(options: EntityPickQueryOptions<string, eris.Member>): Promise<ChoiceQueryResult<eris.Member>> {
        return this.cluster.util.queryMember({
            ...options,
            placeholder: util.literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public queryRole(options: EntityPickQueryOptions<string, eris.Role>): Promise<ChoiceQueryResult<eris.Role>> {
        return this.cluster.util.queryRole({
            ...options,
            placeholder: util.literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public queryChannel<T extends eris.KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>
    public queryChannel(options: EntityPickQueryOptions<string, eris.KnownChannel>): Promise<ChoiceQueryResult<eris.KnownChannel>>
    public queryChannel(options: EntityPickQueryOptions<string, eris.KnownChannel>): Promise<ChoiceQueryResult<eris.KnownChannel>> {
        return this.cluster.util.queryChannel({
            ...options,
            placeholder: util.literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public async warn(member: eris.Member, moderator: eris.User, count: number, reason?: string): Promise<number> {
        const result = await this.cluster.moderation.warns.warn(member, moderator, this.cluster.discord.user, count, util.literal(reason));
        return result.warnings;
    }

    public async pardon(member: eris.Member, moderator: eris.User, count: number, reason?: string): Promise<number> {
        const result = await this.cluster.moderation.warns.pardon(member, moderator, count, util.literal(reason));
        return result.warnings;
    }

    public ban(guild: eris.Guild, user: eris.User, moderator: eris.User, authorizer: eris.User, deleteDays: number, reason: string, duration: moment.Duration): Promise<'success' | 'alreadyBanned' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        return this.cluster.moderation.bans.ban(guild, user, moderator, authorizer, deleteDays, util.literal(reason), duration);
    }

    public unban(guild: eris.Guild, user: eris.User, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'noPerms' | 'moderatorNoPerms' | 'notBanned'> {
        return this.cluster.moderation.bans.unban(guild, user, moderator, authorizer, util.literal(reason));
    }

    public kick(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string): Promise<'success' | 'noPerms' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        return this.cluster.moderation.bans.kick(member, moderator, authorizer, util.literal(reason));
    }
}

function isIndex0String<T extends unknown[]>(value: T): value is Extract<T, { ['0']: string; }> {
    return typeof value[0] === 'string';
}

function toPrompt(value: string | Omit<SendContent<string>, 'components'> | undefined): IFormattable<string> | Omit<SendContent<IFormattable<string>>, 'components'> | undefined {
    switch (typeof value) {
        case 'string':
        case 'undefined':
            return util.literal(value);
        default: return {
            ...value,
            content: util.literal(value.content),
            embeds: value.embeds?.map(e => ({
                ...e,
                title: util.literal(e.title),
                description: util.literal(e.description),
                author: e.author === undefined ? undefined : {
                    ...e.author,
                    name: util.literal(e.author.name)
                },
                footer: e.footer === undefined ? undefined : {
                    ...e.footer,
                    text: util.literal(e.footer.text)
                },
                fields: e.fields?.map(f => ({
                    ...f,
                    name: util.literal(f.name),
                    value: util.literal(f.value)
                }))
            }))
        };
    }
}
