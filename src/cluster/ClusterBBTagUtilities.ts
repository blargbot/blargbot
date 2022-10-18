import { AwaitReactionsResponse, BBTagContext, BBTagUtilities } from '@blargbot/bbtag';
import { Emote } from '@blargbot/core/Emote';
import { ChoiceQueryResult, EntityPickQueryOptions, SendContent, SendContext } from '@blargbot/core/types';
import { IFormattable, literal } from '@blargbot/domain/messages/types';
import { AdvancedMessageContent, Guild, KnownChannel, KnownGuildChannel, KnownMessage, Member, Message, Role, TextableChannel, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { Cluster } from './Cluster';

export class ClusterBBTagUtilities implements BBTagUtilities {
    public get defaultPrefix(): string {
        return this.cluster.config.discord.defaultPrefix;
    }

    public constructor(public readonly cluster: Cluster) {
    }

    public async send<T extends TextableChannel>(context: T, payload: SendContent<string>, author?: User | undefined): Promise<Message<T> | undefined>;
    public async send(context: SendContext, payload: SendContent<string>, author?: User | undefined): Promise<Message<TextableChannel> | undefined>;
    public async send(context: SendContext, payload: SendContent<string>, author?: User | undefined): Promise<Message<TextableChannel> | undefined> {
        return await this.cluster.util.send(context, literal(payload), author);
    }

    public async getChannel(channelId: string): Promise<KnownChannel | undefined>;
    public async getChannel(guild: string | Guild, channelId: string): Promise<KnownGuildChannel | undefined>;
    public async getChannel(...args: [string] | [string | Guild, string]): Promise<KnownChannel | undefined> {
        return args.length === 1
            ? await this.cluster.util.getChannel(...args)
            : await this.cluster.util.getChannel(...args);
    }

    public async findChannels(guild: string | Guild, query?: string | undefined): Promise<KnownGuildChannel[]> {
        return await this.cluster.util.findChannels(guild, query);
    }

    public async ensureMemberCache(guild: Guild): Promise<void> {
        return await this.cluster.util.ensureMemberCache(guild);
    }

    public async getMember(guild: string | Guild, userId: string): Promise<Member | undefined> {
        return await this.cluster.util.getMember(guild, userId);
    }

    public async findMembers(guild: string | Guild, query?: string | undefined): Promise<Member[]> {
        return await this.cluster.util.findMembers(guild, query);
    }

    public async getUser(userId: string): Promise<User | undefined> {
        return await this.cluster.util.getUser(userId);
    }

    public async getRole(guild: string | Guild, roleId: string): Promise<Role | undefined> {
        return await this.cluster.util.getRole(guild, roleId);
    }

    public async findRoles(guild: string | Guild, query?: string | undefined): Promise<Role[]> {
        return await this.cluster.util.findRoles(guild, query);
    }

    public async getMessage(channel: string, messageId: string, force?: boolean | undefined): Promise<KnownMessage | undefined>;
    public async getMessage(channel: KnownChannel, messageId: string, force?: boolean | undefined): Promise<KnownMessage | undefined>;
    public async getMessage(...args: [KnownChannel, string, boolean?] | [string, string, boolean?]): Promise<KnownMessage | undefined> {
        return isIndex0String(args)
            ? await this.cluster.util.getMessage(...args)
            : await this.cluster.util.getMessage(...args);
    }

    public addReactions(context: Message<TextableChannel>, reactions: Iterable<Emote>): Promise<{ success: Emote[]; failed: Emote[]; }> {
        return this.cluster.util.addReactions(context, reactions);
    }

    public async generateDumpPage(payload: AdvancedMessageContent, channel: KnownChannel): Promise<string> {
        return (await this.cluster.util.generateDumpPage(payload, channel)).toString();
    }

    public websiteLink(path?: string | undefined): string {
        return this.cluster.util.websiteLink(path);
    }

    public timeout(member: Member, moderator: User, authorizer: User, duration: Duration, reason?: string | undefined): Promise<`noPerms` | `success` | `alreadyTimedOut` | `memberTooHigh` | `moderatorNoPerms` | `moderatorTooLow`> {
        return this.cluster.moderation.timeouts.timeout(member, moderator, authorizer, duration, literal(reason));
    }

    public clearTimeout(member: Member, moderator: User, authorizer: User, reason?: string | undefined): Promise<`noPerms` | `success` | `moderatorNoPerms` | `notTimedOut`> {
        return this.cluster.moderation.timeouts.clearTimeout(member, moderator, authorizer, literal(reason));
    }

    public addModlog(guild: Guild, action: string, user: User, moderator?: User, reason?: string, color?: number): Promise<void> {
        return this.cluster.moderation.modLog.logCustom(guild, literal(action), user, moderator, literal(reason), color);
    }

    public canRequestDomain(domain: string): boolean {
        return this.cluster.domains.isWhitelisted(domain);
    }

    public isUserStaff(member: Member): Promise<boolean> {
        return this.cluster.util.isUserStaff(member);
    }

    public queryMember(options: EntityPickQueryOptions<string, Member>): Promise<ChoiceQueryResult<Member>> {
        return this.cluster.util.queryMember({
            ...options,
            placeholder: literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public queryRole(options: EntityPickQueryOptions<string, Role>): Promise<ChoiceQueryResult<Role>> {
        return this.cluster.util.queryRole({
            ...options,
            placeholder: literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public queryChannel<T extends KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>>
    public queryChannel(options: EntityPickQueryOptions<string, KnownChannel>): Promise<ChoiceQueryResult<KnownChannel>>
    public queryChannel(options: EntityPickQueryOptions<string, KnownChannel>): Promise<ChoiceQueryResult<KnownChannel>> {
        return this.cluster.util.queryChannel({
            ...options,
            placeholder: literal(options.placeholder),
            prompt: toPrompt(options.prompt)
        });
    }

    public async warn(member: Member, moderator: User, count: number, reason?: string): Promise<number> {
        const result = await this.cluster.moderation.warns.warn(member, moderator, this.cluster.discord.user, count, literal(reason));
        return result.warnings;
    }

    public async pardon(member: Member, moderator: User, count: number, reason?: string): Promise<number> {
        const result = await this.cluster.moderation.warns.pardon(member, moderator, count, literal(reason));
        return result.warnings;
    }

    public ban(guild: Guild, user: User, moderator: User, authorizer: User, deleteDays: number, reason: string, duration: moment.Duration): Promise<`success` | `alreadyBanned` | `noPerms` | `memberTooHigh` | `moderatorNoPerms` | `moderatorTooLow`> {
        return this.cluster.moderation.bans.ban(guild, user, moderator, authorizer, deleteDays, literal(reason), duration);
    }

    public unban(guild: Guild, user: User, moderator: User, authorizer: User, reason?: string): Promise<`success` | `noPerms` | `moderatorNoPerms` | `notBanned`> {
        return this.cluster.moderation.bans.unban(guild, user, moderator, authorizer, literal(reason));
    }

    public kick(member: Member, moderator: User, authorizer: User, reason?: string): Promise<`success` | `noPerms` | `memberTooHigh` | `moderatorNoPerms` | `moderatorTooLow`> {
        return this.cluster.moderation.bans.kick(member, moderator, authorizer, literal(reason));
    }

    public awaitReaction(messages: string[], filter: (reaction: AwaitReactionsResponse) => Awaitable<boolean>, timeoutMs: number): Promise<AwaitReactionsResponse | undefined> {
        return this.cluster.awaiter.reactions.getAwaiter(messages, filter, timeoutMs).wait();
    }

    public awaitMessage(channels: string[], filter: (message: KnownMessage) => Awaitable<boolean>, timeoutMs: number): Promise<KnownMessage | undefined> {
        return this.cluster.awaiter.messages.getAwaiter(channels, filter, timeoutMs).wait();
    }

    public async setTimeout(context: BBTagContext, content: string, timeout: Duration): Promise<void> {
        await this.cluster.timeouts.insert(`tag`, {
            version: 4,
            source: context.guild.id,
            channel: context.channel.id,
            endtime: moment().add(timeout).valueOf(),
            context: JSON.stringify(context.serialize()),
            content: content
        });
    }

}

function isIndex0String<T extends unknown[]>(value: T): value is Extract<T, { [`0`]: string; }> {
    return typeof value[0] === `string`;
}

function toPrompt(value: string | Omit<SendContent<string>, `components`> | undefined): IFormattable<string> | Omit<SendContent<IFormattable<string>>, `components`> | undefined {
    switch (typeof value) {
        case `string`:
        case `undefined`:
            return literal(value);
        default: return {
            ...value,
            content: literal(value.content),
            embeds: value.embeds?.map(e => ({
                ...e,
                title: literal(e.title),
                description: literal(e.description),
                author: e.author === undefined ? undefined : {
                    ...e.author,
                    name: literal(e.author.name)
                },
                footer: e.footer === undefined ? undefined : {
                    ...e.footer,
                    text: literal(e.footer.text)
                },
                fields: e.fields?.map(f => ({
                    ...f,
                    name: literal(f.name),
                    value: literal(f.value)
                }))
            }))
        };
    }
}
