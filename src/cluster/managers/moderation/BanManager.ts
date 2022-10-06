import { BanResult, KickResult, MassBanResult, UnbanResult } from '@blargbot/cluster/types';
import { humanize, sleep } from '@blargbot/cluster/utils';
import { UnbanEventOptions } from '@blargbot/domain/models';
import { mapping } from '@blargbot/mapping';
import { ApiError, AuditLogActionType, DiscordRESTError, Guild, GuildAuditLog, GuildAuditLogEntry, Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class BanManager extends ModerationManagerBase {
    readonly #ignoreBans: Set<`${string}:${string}`>;
    readonly #ignoreUnbans: Set<`${string}:${string}`>;
    readonly #ignoreLeaves: Set<`${string}:${string}`>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.#ignoreBans = new Set();
        this.#ignoreUnbans = new Set();
        this.#ignoreLeaves = new Set();
    }

    public async ban(guild: Guild, user: User, moderator: User, authorizer: User, deleteDays: number, reason: string, duration: Duration): Promise<BanResult> {
        const result = await this.#tryBanUser(guild, user.id, moderator, authorizer, undefined, deleteDays, reason);
        if (result !== `success`) {
            if (typeof result === `string`)
                return result;
            throw result.error;
        }

        if (duration.asMilliseconds() === Infinity) {
            await this.modLog.logBan(guild, user, moderator, reason);
        } else {
            await this.modLog.logSoftban(guild, user, duration, moderator, reason);
            await this.cluster.timeouts.insert(`unban`, {
                source: guild.id,
                guild: guild.id,
                user: user.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).valueOf()
            });
        }

        return `success`;
    }

    public async massBan(guild: Guild, userIds: readonly string[], moderator: User, authorizer: User, deleteDays: number, reason: string): Promise<MassBanResult> {
        if (userIds.length === 0)
            return `noUsers`;

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`banMembers`) !== true)
            return `noPerms`;

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, `banMembers`, `banoverride`);
        if (permMessage !== undefined)
            return permMessage;

        const guildBans = new Set((await guild.getBans()).map(b => b.user.id));
        const banResults = await Promise.all(userIds.map(async userId => ({
            userId,
            result: await this.#tryBanUser(guild, userId, moderator, authorizer, guildBans, deleteDays, reason)
        })));

        const bannedIds = new Set(banResults.filter(r => r.result === `success`).map(r => r.userId));
        if (bannedIds.size === 0) {
            const { result } = banResults[0];
            if (result === `success`)
                throw new Error(`Filter failed to find a successful ban, yet here we are. Curious.`);
            if (typeof result === `string`)
                return result;
            throw result;
        }
        const newBans = await guild.getBans();
        const banned = newBans.filter(b => !guildBans.has(b.user.id) && bannedIds.has(b.user.id)).map(b => b.user);

        await this.modLog.logMassBan(guild, banned, moderator);
        return banned;
    }

    async #tryBanUser(guild: Guild, userId: string, moderator: User, authorizer: User, alreadyBanned: Set<string> | undefined, deleteDays: number, reason: string): Promise<BanResult | { error: unknown; }> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`banMembers`) !== true)
            return `noPerms`;

        const permMessage = await this.checkModerator(guild, userId, authorizer.id, `banMembers`, `banoverride`);
        if (permMessage !== undefined)
            return permMessage;

        const member = await this.cluster.util.getMember(guild, userId);
        if (member !== undefined && !this.cluster.util.isBotHigher(member))
            return `memberTooHigh`;

        alreadyBanned ??= new Set((await guild.getBans()).map(b => b.user.id));
        if (alreadyBanned.has(userId))
            return `alreadyBanned`;

        this.#ignoreBans.add(`${guild.id}:${userId}`);
        try {
            await guild.banMember(userId, deleteDays, `[${humanize.fullName(moderator)}] ${reason}`);
        } catch (err: unknown) {
            this.#ignoreBans.delete(`${guild.id}:${userId}`);
            return { error: err };
        }
        return `success`;
    }

    public async unban(guild: Guild, user: User, moderator: User, authorizer: User, reason?: string): Promise<UnbanResult> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`banMembers`) !== true)
            return `noPerms`;

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, `banMembers`, `banoverride`);
        if (permMessage !== undefined)
            return permMessage;

        try {
            await guild.getBan(user.id);
        } catch (err: unknown) {
            if (err instanceof DiscordRESTError && err.code === ApiError.UNKNOWN_BAN)
                return `notBanned`;
            throw err;
        }

        this.#ignoreUnbans.add(`${guild.id}:${user.id}`);
        await guild.unbanMember(user.id, `[${humanize.fullName(moderator)}] ${reason ?? ``}`);
        await this.modLog.logUnban(guild, user, moderator, reason);

        return `success`;
    }

    public async kick(member: Member, moderator: User, authorizer: User, reason?: string): Promise<KickResult> {
        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`kickMembers`) !== true)
            return `noPerms`;

        const permMessage = await this.checkModerator(member.guild, member.id, authorizer.id, `kickMembers`, `kickoverride`);
        if (permMessage !== undefined)
            return permMessage;

        if (!this.cluster.util.isBotHigher(member))
            return `memberTooHigh`;

        this.#ignoreLeaves.add(`${member.guild.id}:${member.id}`);
        try {
            await member.guild.kickMember(member.id, `[${humanize.fullName(moderator)}] ${reason ?? ``}`);
        } catch (err: unknown) {
            this.#ignoreLeaves.delete(`${member.guild.id}:${member.id}`);
            throw err;
        }
        await this.modLog.logKick(member.guild, member.user, moderator, reason);
        return `success`;
    }

    public async banExpired(event: UnbanEventOptions): Promise<void> {
        const guild = await this.cluster.util.getGuild(event.guild);
        if (guild === undefined)
            return;

        const user = await this.cluster.util.getUser(event.user);
        if (user === undefined)
            return;

        const mapResult = mapDuration(event.duration);
        const duration = mapResult.valid ? humanize.duration(mapResult.value) : `some time`;

        await this.unban(guild, user, this.cluster.discord.user, this.cluster.discord.user, `Automatically unbanned after ${duration}.`);
    }

    public async userBanned(guild: Guild, user: User): Promise<void> {
        if (this.#ignoreBans.delete(`${guild.id}:${user.id}`))
            return;

        const log = await this.#findAuditLog(guild, user.id, AuditLogActionType.MEMBER_BAN_ADD);
        await this.modLog.logBan(guild, user, log?.user, log?.reason ?? undefined);
    }

    public async userUnbanned(guild: Guild, user: User): Promise<void> {
        if (this.#ignoreUnbans.delete(`${guild.id}:${user.id}`))
            return;

        const log = await this.#findAuditLog(guild, user.id, AuditLogActionType.MEMBER_BAN_REMOVE);
        await this.modLog.logUnban(guild, user, log?.user, log?.reason ?? undefined);
    }

    public async userLeft(member: Member): Promise<void> {
        if (this.#ignoreLeaves.delete(`${member.guild.id}:${member.id}`))
            return;

        const log = await this.#findAuditLog(member.guild, member.id, AuditLogActionType.MEMBER_KICK);
        if (log === undefined) // no kick audit log, so they probably just left. Dont log.
            return;

        await this.modLog.logKick(member.guild, member.user, log.user, log.reason ?? undefined);
    }

    async #findAuditLog(guild: Guild, targetId: string, type: AuditLogActionType): Promise<GuildAuditLogEntry | undefined> {
        const eventTime = moment().add(-30, `seconds`);
        await sleep(2000); // To ensure the audit log has appeared
        const auditLogs = await tryGetAuditLogs(guild, 50, undefined, type);
        return auditLogs?.entries
            .sort((a, b) => b.createdAt - a.createdAt)
            .find(log => log.targetID === targetId && moment(log.createdAt).isAfter(eventTime));
    }
}

async function tryGetAuditLogs(guild: Guild, limit?: number, before?: string, type?: AuditLogActionType): Promise<GuildAuditLog | undefined> {
    try {
        return await guild.getAuditLog({ limit, before, actionType: type });
    } catch (err: unknown) {
        if (err instanceof DiscordRESTError && err.code === ApiError.MISSING_PERMISSIONS)
            return undefined;
        throw err;
    }
}

const mapDuration = mapping.json(mapping.duration);
