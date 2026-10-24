import type { BBTagSendContent, BBTagUtilities, ReactionEvent, RwLock, SerializedBBTagContext, subtags, VariablesProvider } from '@blargbot/bbtag';
import { ChannelType, DiscordPermissions, getLock } from '@blargbot/bbtag';
import type * as Subtags from '@blargbot/bbtag/subtags';
import { type ChoiceQueryResult, type Emote, type EntityPickQueryOptions, type SendContent, snowflake } from '@blargbot/core';
import type { GuildCommandTag, StoredTag, TagVariableScope } from '@blargbot/domain';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import type { Logger } from '@blargbot/logger';
import { raceAsyncIterable, sleep, usingTimeout } from '@blargbot/util';
import * as eris from 'eris';
import moment from 'moment-timezone';

import { isThreadChannel } from '../core/utils/guard/isThreadChannel.js';
import { bindAll } from './bindAll.js';
import type { Cluster } from './Cluster.js';
import { guard } from './utils/index.js';

type SubtagConstructorArgs = typeof subtags[keyof typeof subtags] extends new (arg: infer R) => unknown ? R : never;
@bindAll
export class ClusterSubtagConstructorArgs implements SubtagConstructorArgs {
    readonly #cluster: Cluster;

    public get defaultPrefix(): string {
        return this.#cluster.config.discord.defaultPrefix;
    };
    public get logger(): Logger {
        return this.#cluster.logger;
    }
    public get variables(): VariablesProvider {
        return this.#cluster.bbtagVariables;
    }

    public constructor(cluster: Cluster) {
        this.#cluster = cluster;
    }

    public async fetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
        return await this.#cluster.fetch(input, init);
    }
    public getLock(scope: TagVariableScope, name: string): RwLock {
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
    public async isUserStaff(guildId: string, userId: string): Promise<boolean> {
        const guild = await this.#cluster.util.getGuild(guildId);
        const member = guild?.members.get(userId);
        if (member === undefined)
            return false;
        return await this.#cluster.util.isUserStaff(member);
    }
    public async getUserPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions> {
        const result = await this.#getUserPermissions(guildId, userId, channelId);
        return result.has('ADMINISTRATOR')
            ? new DiscordPermissions(~0n)
            : result;
    }
    async #getUserPermissions(guildId: string, userId: string, channelId?: string): Promise<DiscordPermissions> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (channelId === undefined)
            return new DiscordPermissions(guild?.members.get(userId)?.permissions.allow ?? 0n);

        const channel = guild?.channels.get(channelId);
        return new DiscordPermissions(channel?.permissionsOf(userId).allow ?? 0n);
    }
    public async getWarnings(guildId: string, userId: string): Promise<number | undefined> {
        return await this.#cluster.database.guilds.getWarnings(guildId, userId);
    }
    public async warn(options: Subtags.WarnOptions): Promise<number> {
        const { guildId, targetId, moderatorId, count, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return 0;
        const target = guild.members.get(targetId);
        if (target === undefined) return 0;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return 0;
        const result = await this.#cluster.moderation.warns.warn(target, moderator, this.#cluster.discord.user, count, util.literal(reason));
        return result.warnings;
    }
    public async pardon(options: Subtags.PardonOptions): Promise<number> {
        const { guildId, targetId, moderatorId, count, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return 0;
        const target = guild.members.get(targetId);
        if (target === undefined) return 0;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return 0;
        const result = await this.#cluster.moderation.warns.pardon(target, moderator, count, util.literal(reason));
        return result.warnings;
    }
    public async getBannedUsers(guildId: string): Promise<readonly string[] | undefined> {
        try {
            const guild = await this.#cluster.util.getGuild(guildId);
            if (guild === undefined) return undefined;
            await this.#cluster.util.ensureGuildBans(guild);
            return [...this.#cluster.util.getGuildBans(guild)];
        } catch (error) {
            this.#handleError(error);
            return undefined;
        }
    }
    public async banUser(options: Subtags.BanUserOptions): Promise<Subtags.BanUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, daysToDelete, reason, unbanAfter = moment.duration(Infinity) } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, reason: 'bot' };
        const target = await this.#cluster.util.getUser(targetId);
        if (target === undefined) return { success: false, reason: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, reason: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, reason: 'authorizer' };
        const result = await this.#cluster.moderation.bans.ban(guild, target, moderator, authorizer, daysToDelete, util.literal(reason), unbanAfter);
        switch (result) {
            case 'success':
            case 'alreadyBanned':
                return { success: true };
            case 'memberTooHigh':
            case 'noPerms':
                return { success: false, reason: 'bot' };
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                return { success: false, reason: 'authorizer' };
            default:
                return { success: false, reason: reason as never };
        }
    }
    public async unbanUser(options: Subtags.UnbanUserOptions): Promise<Subtags.UnbanUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, reason: 'bot' };
        const target = await this.#cluster.util.getUser(targetId);
        if (target === undefined) return { success: false, reason: 'notBanned' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, reason: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, reason: 'authorizer' };
        const result = await this.#cluster.moderation.bans.unban(guild, target, moderator, authorizer, util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'notBanned':
                return { success: false, reason: 'notBanned' };
            case 'noPerms':
                return { success: false, reason: 'bot' };
            case 'moderatorNoPerms':
                return { success: false, reason: 'authorizer' };
            default:
                return { success: false, reason: reason as never };
        }
    }
    public async kickUser(options: Subtags.KickUserOptions): Promise<Subtags.KickUserResult> {
        const { guildId, targetId, moderatorId, authorizerId, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, reason: 'bot' };
        const target = guild.members.get(targetId);
        if (target === undefined) return { success: false, reason: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, reason: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, reason: 'authorizer' };
        const result = await this.#cluster.moderation.bans.kick(target, moderator, authorizer, util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'noPerms':
                return { success: false, reason: 'bot' };
            case 'moderatorNoPerms':
                return { success: false, reason: 'authorizer' };
            default:
                return { success: false, reason: reason as never };
        }
    }
    public async setUserTimeout(options: Subtags.SetUserTimeoutOptions): Promise<Subtags.SetUserTimeoutResult> {
        const { guildId, targetId, moderatorId, authorizerId, reason, duration } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return { success: false, reason: 'bot' };
        const target = guild.members.get(targetId);
        if (target === undefined) return { success: false, reason: 'bot' };
        const moderator = await this.#cluster.util.getUser(moderatorId);
        if (moderator === undefined) return { success: false, reason: 'authorizer' };
        const authorizer = await this.#cluster.util.getUser(authorizerId);
        if (authorizer === undefined) return { success: false, reason: 'authorizer' };
        const result = duration.asMilliseconds() === 0
            ? await this.#cluster.moderation.timeouts.clearTimeout(target, moderator, authorizer, util.literal(reason))
            : await this.#cluster.moderation.timeouts.timeout(target, moderator, authorizer, duration, util.literal(reason));
        switch (result) {
            case 'success':
                return { success: true };
            case 'alreadyTimedOut':
            case 'notTimedOut':
                return { success: false, reason: 'noChange' };
            case 'noPerms':
            case 'memberTooHigh':
                return { success: false, reason: 'bot' };
            case 'moderatorNoPerms':
            case 'moderatorTooLow':
                return { success: false, reason: 'authorizer' };
            default:
                return { success: false, reason: reason as never };
        }
    }
    public async addModLog(options: Subtags.AddModLogOptions): Promise<void> {
        const { guildId, targetId, moderatorId, action, color, reason } = options;
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return;
        const target = this.#cluster.discord.users.get(targetId);
        if (target === undefined) return;
        const moderator = this.#cluster.discord.users.get(moderatorId);
        if (moderator === undefined) return;
        await this.#cluster.moderation.modLog.logCustom(guild, util.literal(action), target, moderator, util.literal(reason), color);
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
    public async listRoleMembers(guildId: string, roleId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return [];
        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.filter(m => m.roles.includes(roleId))
            .map(m => m.id);
    }
    public async getRoleMemberCount(guildId: string, roleId: string): Promise<number> {
        const members = await this.listRoleMembers(guildId, roleId);
        return members.length;
    }
    public async listGuildMembers(guildId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined) return [];
        await this.#cluster.util.ensureMemberCache(guild);
        return guild.members.map(m => m.id);
    }
    public async getGuildMemberCount(guildId: string): Promise<number> {
        const members = await this.listGuildMembers(guildId);
        return members.length;
    }
    public async generateDumpLink(options: Subtags.DumpOptions): Promise<URL> {
        const id = await this.#cluster.util.generateDumpPage({ content: options.content }, snowflake.parse(options.channelId));
        return new URL(this.#cluster.util.websiteLink(`dumps/${id}`));
    }
    public async executeWebhook(webhookId: string, webhookToken: string, payload: Subtags.ExecuteWebhookPayload): Promise<Subtags.ExecuteWebhookResult> {
        try {
            await this.#cluster.discord.executeWebhook(webhookId, webhookToken, payload);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async send(channelId: string, payload: Subtags.SendPayload): Promise<Subtags.SendResult> {
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
    async #getChannel(guildId: string, channelId: string): Promise<eris.KnownGuildChannel | undefined> {
        if (!snowflake.test(guildId) || !snowflake.test(channelId))
            return undefined;
        const channel = await this.#cluster.util.getChannel(channelId);
        if (channel === undefined || !('guild' in channel) || channel.guild.id !== guildId)
            return undefined;
        return channel;
    }
    async #getChannelProp<Prop extends KeysOfUnion<eris.KnownChannel>>(guildId: string, channelId: string, prop: Prop): Promise<ValueOfUnion<eris.KnownChannel, Prop> | undefined> {
        const channel = await this.#getChannel(guildId, channelId);
        if (channel === undefined || !(prop in channel))
            return undefined;
        return channel[prop as never];
    }
    public async getCategoryChannels(guildId: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        return guild?.channels.filter(c => c.type === ChannelType.GUILD_CATEGORY).map(x => x.id) ?? [];
    }
    public async getChannelName(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'name');
    }
    public async getChannelCategory(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'parentID') ?? undefined;
    }
    public async getChannelType(guildId: string, channelId: string): Promise<number | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'type');
    }
    public async getLastMessageId(guildId: string, channelId: string): Promise<string | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'lastMessageID');
    }
    public async deleteChannel(guildId: string, channelId: string, auditReason: string): Promise<Subtags.DeleteChannelResult> {
        try {
            const channel = await this.#getChannel(guildId, channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel doesnt exist.' };
            await channel.delete(auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async createChannel(guildId: string, { name, type, ...options }: Subtags.CreateChannelOptions): Promise<Subtags.CreateChannelResult> {
        try {
            const guild = await this.#cluster.util.getGuild(guildId);
            if (guild === undefined)
                return { success: false, reason: 'Guild is missing' };
            const channel = await guild.createChannel(name, type, options) as eris.GuildChannel;
            return { success: true, channelId: channel.id };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async editChannel(guildId: string, channelId: string, options: Subtags.EditChannelOptions): Promise<Subtags.EditChannelResult> {
        try {
            const channel = await this.#getChannel(guildId, channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found' };
            await channel.edit(options);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async setPermissionOverride(options: Subtags.SetPermissionOverrideOptions): Promise<Subtags.SetPermissionOverrideResult> {
        try {
            const channel = await this.#getChannel(options.guildId, options.channelId);
            if (channel === undefined)
                return { success: false, reason: 'Channel not found' };
            if ('allow' in options)
                await channel.editPermission(options.entityId, options.allow, options.deny, options.type, options.auditReason);
            else
                await channel.deletePermission(options.entityId, options.auditReason);
            return { success: true };
        } catch (error) {
            return this.#handleError(error);
        }
    }
    public async isChannelNsfw(guildId: string, channelId: string): Promise<boolean | undefined> {
        return await this.#getChannelProp(guildId, channelId, 'nsfw');
    }
    public async listChannels(guildId: string, parentId?: string): Promise<readonly string[]> {
        const guild = await this.#cluster.util.getGuild(guildId);
        if (guild === undefined)
            return [];
        const channels = parentId === undefined
            ? guild.channels
            : guild.channels.filter(c => c.parentID === parentId);
        return channels.map(c => c.id);
    }
    public async getChannelPosition(guildId: string, channelId: string): Promise<number | 'thread' | undefined> {
        const channel = await this.#getChannel(guildId, channelId);
        if (channel === undefined) return undefined;
        if (isThreadChannel(channel)) return 'thread';
        return channel.position;
    }
    public async checkChannelExists(guildId: string, channelId: string): Promise<boolean> {
        return await this.#getChannelProp(guildId, channelId, 'id') === channelId;
    }
    public async findChannel(guildId: string, searchText: string): Promise<string | undefined> {
        const candidates = await this.#cluster.util.findChannels(guildId, searchText);
        return candidates.length === 1 ? candidates[0].id : undefined;
    }
    public async queryChannel(options: Subtags.QueryChannelOptions): Promise<Subtags.QueryChannelResult> {
        const candidates = await this.#cluster.util.findChannels(options.guildId, options.searchText);
        if (candidates.length === 1)
            return { success: true, channelId: candidates[0].id };
        const channel = await this.#cluster.util.getChannel(options.channelId);
        if (channel === undefined || !guard.isTextableChannel(channel))
            return { success: false, reason: 'aborted' };
        if (candidates.length === 0) {
            if (options.source !== undefined) {
                await this.#cluster.util.send(channel, util.literal({
                    content: `No channel matching \`${options.searchText}\` found in ${options.source}.`
                }));
            }
            return { success: false, reason: 'notFound' };
        }

        const result = await this.#cluster.util.queryChannel({
            context: channel,
            actors: [options.userId],
            choices: candidates,
            filter: options.searchText
        });
        switch (result.state) {
            case 'SUCCESS':
                return { success: true, channelId: result.value.id };
            case 'CANCELLED':
            case 'TIMED_OUT':
                return { success: false, reason: 'aborted' };
            case 'FAILED':
            case 'NO_OPTIONS':
                return { success: false, reason: 'notFound' };
            default:
                return { success: false, reason: 'aborted' };
        }
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
type KeysOfUnion<T> = T extends unknown ? keyof T : never;
type ValueOfUnion<T, K extends PropertyKey> =
    T extends unknown ? K extends keyof T ? T[K] : never : never;
