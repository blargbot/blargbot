import type { AwaitReactionsResponse, BBTagContext, BBTagSendContent, BBTagUtilities } from '@blargbot/bbtag';
import type { Emote } from '@blargbot/core/Emote.js';
import type { ChoiceQueryResult, EntityPickQueryOptions, SendContent } from '@blargbot/core/types.js';
import type { IFormattable } from '@blargbot/formatting';
import { util } from '@blargbot/formatting';
import type * as eris from 'eris';
import moment from 'moment-timezone';

import type { Cluster } from './Cluster.js';
import { guard } from './utils/index.js';

export class ClusterBBTagUtilities implements BBTagUtilities {
    public get defaultPrefix(): string {
        return this.cluster.config.discord.defaultPrefix;
    }

    public constructor(public readonly cluster: Cluster) {
    }

    public async send<T extends eris.TextableChannel>(channel: T, payload: BBTagSendContent, author?: eris.User  ): Promise<eris.Message<T> | undefined> {
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

    public async findChannels(guild: string | eris.Guild, query?: string  ): Promise<eris.KnownGuildChannel[]> {
        return await this.cluster.util.findChannels(guild, query);
    }

    public async ensureMemberCache(guild: eris.Guild): Promise<void> {
        return await this.cluster.util.ensureMemberCache(guild);
    }

    public async getMember(guild: string | eris.Guild, userId: string): Promise<eris.Member | undefined> {
        return await this.cluster.util.getMember(guild, userId);
    }

    public async findMembers(guild: string | eris.Guild, query?: string  ): Promise<eris.Member[]> {
        return await this.cluster.util.findMembers(guild, query);
    }

    public async getUser(userId: string): Promise<eris.User | undefined> {
        return await this.cluster.util.getUser(userId);
    }

    public async getRole(guild: string | eris.Guild, roleId: string): Promise<eris.Role | undefined> {
        return await this.cluster.util.getRole(guild, roleId);
    }

    public async findRoles(guild: string | eris.Guild, query?: string  ): Promise<eris.Role[]> {
        return await this.cluster.util.findRoles(guild, query);
    }

    public async getMessage(channel: string, messageId: string, force?: boolean  ): Promise<eris.KnownMessage | undefined>;
    public async getMessage(channel: eris.KnownChannel, messageId: string, force?: boolean  ): Promise<eris.KnownMessage | undefined>;
    public async getMessage(...args: [eris.KnownChannel, string, boolean?] | [string, string, boolean?]): Promise<eris.KnownMessage | undefined> {
        return isIndex0String(args)
            ? await this.cluster.util.getMessage(...args)
            : await this.cluster.util.getMessage(...args);
    }

    public addReactions(context: eris.Message<eris.TextableChannel>, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
        return this.cluster.util.addReactions(context, reactions);
    }

    public async getBannedUsers(guild: eris.Guild): Promise<string[]> {
        await this.cluster.util.ensureGuildBans(guild);
        const bans = this.cluster.util.getGuildBans(guild);
        return [...bans];
    }

    public async generateDumpPage(payload: eris.AdvancedMessageContent, channel: eris.KnownChannel): Promise<string> {
        return (await this.cluster.util.generateDumpPage(payload, channel)).toString();
    }

    public websiteLink(path?: string  ): string {
        return this.cluster.util.websiteLink(path);
    }

    public timeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, duration: moment.Duration, reason?: string  ): Promise<'noPerms' | 'success' | 'alreadyTimedOut' | 'memberTooHigh' | 'moderatorNoPerms' | 'moderatorTooLow'> {
        return this.cluster.moderation.timeouts.timeout(member, moderator, authorizer, duration, util.literal(reason));
    }

    public clearTimeout(member: eris.Member, moderator: eris.User, authorizer: eris.User, reason?: string  ): Promise<'noPerms' | 'success' | 'moderatorNoPerms' | 'notTimedOut'> {
        return this.cluster.moderation.timeouts.clearTimeout(member, moderator, authorizer, util.literal(reason));
    }

    public addModLog(guild: eris.Guild, action: string, user: eris.User, moderator?: eris.User, reason?: string, color?: number): Promise<void> {
        return this.cluster.moderation.modLog.logCustom(guild, util.literal(action), user, moderator, util.literal(reason), color);
    }

    public canRequestDomain(domain: string): boolean {
        return this.cluster.domains.isWhitelisted(domain);
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

    public awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined> {
        return this.cluster.awaiter.reactions.getAwaiter(messages, filter, timeoutMs).wait();
    }

    public awaitMessage(channels: string[], filter: (message: eris.KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<eris.KnownMessage | undefined> {
        return this.cluster.awaiter.messages.getAwaiter(channels, filter, timeoutMs).wait();
    }

    public async setTimeout(context: BBTagContext, content: string, timeout: moment.Duration): Promise<void> {
        await this.cluster.timeouts.insert('tag', {
            version: 4,
            source: context.guild.id,
            channel: context.channel.id,
            endtime: moment().add(timeout).valueOf(),
            context: JSON.stringify(context.serialize()),
            content: content
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
