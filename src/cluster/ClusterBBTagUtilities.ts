import { AwaitReactionsResponse, BBTagContext, BBTagUtilities } from '@blargbot/bbtag';
import { ChoiceQueryResult, EntityPickQueryOptions } from '@blargbot/core/types';
import { literal } from '@blargbot/domain/messages/types';
import { Guild, KnownChannel, KnownMessage, Member, Role, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { Cluster } from './Cluster';

export class ClusterBBTagUtilities implements BBTagUtilities {
    public constructor(public readonly cluster: Cluster) {
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
        return this.cluster.util.queryMember(options);
    }

    public queryRole(options: EntityPickQueryOptions<string, Role>): Promise<ChoiceQueryResult<Role>> {
        return this.cluster.util.queryRole(options);
    }

    public queryChannel<T extends KnownChannel>(options: EntityPickQueryOptions<string, T>): Promise<ChoiceQueryResult<T>> {
        return this.cluster.util.queryChannel(options);
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
