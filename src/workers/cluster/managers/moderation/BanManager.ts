import { BanResult, KickResult, MassBanResult, UnbanResult } from '@cluster/types';
import { humanize, mapping } from '@cluster/utils';
import { UnbanEventOptions } from '@core/types';
import { ApiError, AuditLogActionType, DiscordRESTError, Guild, GuildAuditLog, Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class BanManager extends ModerationManagerBase {
    private readonly ignoreBans: Set<`${string}:${string}`>;
    private readonly ignoreUnbans: Set<`${string}:${string}`>;
    private readonly ignoreLeaves: Set<`${string}:${string}`>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.ignoreBans = new Set();
        this.ignoreUnbans = new Set();
        this.ignoreLeaves = new Set();
    }

    public async ban(guild: Guild, user: User, moderator: User, checkModerator: boolean, deleteDays: number, reason: string, duration: Duration): Promise<BanResult> {
        const result = await this.tryBanUser(guild, user.id, moderator, checkModerator, undefined, deleteDays, reason);
        if (result !== 'success') {
            if (typeof result === 'string')
                return result;
            throw result.error;
        }

        if (duration.asMilliseconds() === Infinity) {
            await this.modLog.logBan(guild, user, moderator, reason);
        } else {
            await this.modLog.logSoftban(guild, user, duration, moderator, reason);
            const data = {
                source: guild.id,
                guild: guild.id,
                user: user.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).valueOf()
            };
            await this.cluster.timeouts.insert('unban', data);
        }

        return 'success';
    }

    public async massBan(guild: Guild, userIds: readonly string[], moderator: User, checkModerator: boolean, deleteDays: number, reason: string): Promise<MassBanResult> {
        if (userIds.length === 0)
            return 'noUsers';

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        if (checkModerator) {
            const permMessage = await this.checkModerator(guild, undefined, moderator.id, 'banMembers', 'banoverride');
            if (permMessage !== undefined)
                return permMessage;
        }

        const guildBans = new Set((await guild.getBans()).map(b => b.user.id));
        const banResults = await Promise.all(userIds.map(async userId => ({
            userId,
            result: await this.tryBanUser(guild, userId, moderator, checkModerator, guildBans, deleteDays, reason)
        })));

        const bannedIds = new Set(banResults.filter(r => r.result === 'success').map(r => r.userId));
        if (bannedIds.size === 0) {
            const { result } = banResults[0];
            if (result === 'success')
                throw new Error('Filter failed to find a successful ban, yet here we are. Curious.');
            if (typeof result === 'string')
                return result;
            throw result;
        }
        const newBans = await guild.getBans();
        const banned = newBans.filter(b => !guildBans.has(b.user.id) && bannedIds.has(b.user.id)).map(b => b.user);

        await this.modLog.logMassBan(guild, banned, moderator);
        return banned;
    }

    private async tryBanUser(guild: Guild, userId: string, moderator: User, checkModerator: boolean, alreadyBanned: Set<string> | undefined, deleteDays: number, reason: string): Promise<BanResult | { error: unknown; }> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        if (checkModerator) {
            const permMessage = await this.checkModerator(guild, userId, moderator.id, 'banMembers', 'banoverride');
            if (permMessage !== undefined)
                return permMessage;
        }

        const member = await this.cluster.util.getMember(guild, userId);
        if (member !== undefined && !this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        alreadyBanned ??= new Set((await guild.getBans()).map(b => b.user.id));
        if (alreadyBanned.has(userId))
            return 'alreadyBanned';

        this.ignoreBans.add(`${guild.id}:${userId}`);
        try {
            await guild.banMember(userId, deleteDays, `[${humanize.fullName(moderator)}] ${reason}`);
        } catch (err: unknown) {
            this.ignoreBans.delete(`${guild.id}:${userId}`);
            return { error: err };
        }
        return 'success';
    }

    public async unban(guild: Guild, user: User, moderator: User, checkModerator: boolean, reason?: string): Promise<UnbanResult> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        if (checkModerator) {
            const permMessage = await this.checkModerator(guild, undefined, moderator.id, 'banMembers', 'banoverride');
            if (permMessage !== undefined)
                return permMessage;
        }

        const bans = await guild.getBans();
        if (bans.every(b => b.user.id !== user.id))
            return 'notBanned';

        this.ignoreUnbans.add(`${guild.id}:${user.id}`);
        await guild.unbanMember(user.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modLog.logUnban(guild, user, moderator, reason);

        return 'success';
    }

    public async kick(member: Member, moderator: User, checkModerator: boolean, reason?: string): Promise<KickResult> {
        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('kickMembers') !== true)
            return 'noPerms';

        if (checkModerator) {
            const permMessage = await this.checkModerator(member.guild, member.id, moderator.id, 'kickMembers', 'kickoverride');
            if (permMessage !== undefined)
                return permMessage;
        }

        if (!this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        this.ignoreLeaves.add(`${member.guild.id}:${member.id}`);
        try {
            await member.guild.kickMember(member.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        } catch (err: unknown) {
            this.ignoreLeaves.delete(`${member.guild.id}:${member.id}`);
            throw err;
        }
        await this.modLog.logKick(member.guild, member.user, moderator, reason);
        return 'success';
    }

    public async banExpired(event: UnbanEventOptions): Promise<void> {
        const guild = await this.cluster.util.getGuild(event.guild);
        if (guild === undefined)
            return;

        const user = await this.cluster.util.getUser(event.user);
        if (user === undefined)
            return;

        const mapResult = mapDuration(event.duration);
        const duration = mapResult.valid ? humanize.duration(mapResult.value) : 'some time';

        await this.unban(guild, user, this.cluster.discord.user, false, `Automatically unbanned after ${duration}.`);
    }

    public async userBanned(guild: Guild, user: User): Promise<void> {
        if (!this.ignoreBans.delete(`${guild.id}:${user.id}`))
            await this.modLog.logBan(guild, user);
    }

    public async userUnbanned(guild: Guild, user: User): Promise<void> {
        if (!this.ignoreUnbans.delete(`${guild.id}:${user.id}`))
            await this.modLog.logUnban(guild, user);
    }

    public async userLeft(member: Member): Promise<void> {
        if (this.ignoreLeaves.delete(`${member.guild.id}:${member.id}`))
            return;

        const now = moment();
        const auditLogs = await tryGetAuditLogs(member.guild, 50, undefined, AuditLogActionType.MEMBER_KICK);
        for (const log of auditLogs?.entries.values() ?? []) {
            if (log.target?.id === member.id && moment(log.createdAt).isAfter(now.add(-1, 'second'))) {
                await this.modLog.logKick(member.guild, member.user, member.user, log.reason ?? undefined);
                break;
            }
        }
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
