import { BanResult, KickResult, MassBanResult, UnbanResult } from '@blargbot/cluster/types.js';
import { guard, sleep } from '@blargbot/cluster/utils/index.js';
import { UnbanEventOptions } from '@blargbot/domain/models/index.js';
import { format, IFormattable, util } from '@blargbot/formatting';
import { mapping } from '@blargbot/mapping';
import Eris from 'eris';
import moment from 'moment-timezone';

import templates from '../../text.js';
import { ModerationManager } from '../ModerationManager.js';
import { ModerationManagerBase } from './ModerationManagerBase.js';

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

    public async ban(guild: Eris.Guild, user: Eris.User, moderator: Eris.User, authorizer: Eris.User, deleteDays: number, reason: IFormattable<string>, duration: moment.Duration): Promise<BanResult> {
        const result = await this.#tryBanUser(guild, user.id, moderator, authorizer, deleteDays, reason);
        if (result !== 'success') {
            if (typeof result === 'string')
                return result;
            throw result.error;
        }

        if (duration.asMilliseconds() === Infinity) {
            await this.modLog.logBan(guild, user, moderator, reason);
        } else {
            await this.modLog.logSoftban(guild, user, duration, moderator, reason);
            await this.cluster.timeouts.insert('unban', {
                source: guild.id,
                guild: guild.id,
                user: user.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).valueOf()
            });
        }

        return 'success';
    }

    public async massBan(guild: Eris.Guild, userIds: readonly string[], moderator: Eris.User, authorizer: Eris.User, deleteDays: number, reason: IFormattable<string>): Promise<MassBanResult> {
        if (userIds.length === 0)
            return 'noUsers';

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, 'banMembers', 'banoverride');
        if (permMessage !== undefined)
            return permMessage;

        const banResults = await Promise.all(userIds.map(async userId => ({
            userId,
            result: await this.#tryBanUser(guild, userId, moderator, authorizer, deleteDays, reason)
        })));

        const bannedIds = new Set(banResults.filter(r => r.result === 'success').map(r => r.userId));
        if (bannedIds.size === 0) {
            const { result } = banResults[0];
            if (result === 'success')
                throw new Error('Filter failed to find a successful ban, yet here we are. Curious.');
            if (typeof result === 'string')
                return result;
            throw result.error;
        }

        const allBans = await this.cluster.util.requestAllBans(guild);
        const banLookup = new Map(allBans.map(b => [b.user.id, b.user] as const));
        const banned = [...bannedIds].map(id => banLookup.get(id)).filter(guard.hasValue);

        await this.modLog.logMassBan(guild, banned, moderator);
        return banned;
    }

    async #tryBanUser(guild: Eris.Guild, userId: string, moderator: Eris.User, authorizer: Eris.User, deleteDays: number, reason: IFormattable<string>): Promise<BanResult | { error: unknown; }> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        const permMessage = await this.checkModerator(guild, userId, authorizer.id, 'banMembers', 'banoverride');
        if (permMessage !== undefined)
            return permMessage;

        const member = await this.cluster.util.getMember(guild, userId);
        if (member !== undefined && !this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        await this.cluster.util.ensureGuildBans(guild);
        const alreadyBanned = this.cluster.util.getGuildBans(guild);
        if (alreadyBanned.has(userId))
            return 'alreadyBanned';

        this.#ignoreBans.add(`${guild.id}:${userId}`);
        try {
            const formatter = await this.manager.cluster.util.getFormatter(guild);
            await guild.banMember(userId, deleteDays, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        } catch (err: unknown) {
            this.#ignoreBans.delete(`${guild.id}:${userId}`);
            return { error: err };
        }
        return 'success';
    }

    public async unban(guild: Eris.Guild, user: Eris.User, moderator: Eris.User, authorizer: Eris.User, reason?: IFormattable<string>): Promise<UnbanResult> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, 'banMembers', 'banoverride');
        if (permMessage !== undefined)
            return permMessage;

        try {
            await guild.getBan(user.id);
        } catch (err: unknown) {
            if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.UNKNOWN_BAN)
                return 'notBanned';
            throw err;
        }

        this.#ignoreUnbans.add(`${guild.id}:${user.id}`);
        const formatter = await this.manager.cluster.util.getFormatter(guild);
        await guild.unbanMember(user.id, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        await this.modLog.logUnban(guild, user, moderator, reason);

        return 'success';
    }

    public async kick(member: Eris.Member, moderator: Eris.User, authorizer: Eris.User, reason?: IFormattable<string>): Promise<KickResult> {
        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('kickMembers') !== true)
            return 'noPerms';

        const permMessage = await this.checkModerator(member.guild, member.id, authorizer.id, 'kickMembers', 'kickoverride');
        if (permMessage !== undefined)
            return permMessage;

        if (!this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        this.#ignoreLeaves.add(`${member.guild.id}:${member.id}`);
        try {
            const formatter = await this.manager.cluster.util.getFormatter(member.guild);
            await member.guild.kickMember(member.id, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        } catch (err: unknown) {
            this.#ignoreLeaves.delete(`${member.guild.id}:${member.id}`);
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
        const duration = mapResult.valid ? mapResult.value : undefined;

        await this.unban(guild, user, this.cluster.discord.user, this.cluster.discord.user, templates.ban.autoUnban({ duration }));
    }

    public async userBanned(guild: Eris.Guild, user: Eris.User): Promise<void> {
        if (this.#ignoreBans.delete(`${guild.id}:${user.id}`))
            return;

        const log = await this.#findAuditLog(guild, user.id, Eris.AuditLogActionType.MEMBER_BAN_ADD);
        await this.modLog.logBan(guild, user, log?.user, util.literal(log?.reason ?? undefined));
    }

    public async userUnbanned(guild: Eris.Guild, user: Eris.User): Promise<void> {
        if (this.#ignoreUnbans.delete(`${guild.id}:${user.id}`))
            return;

        const log = await this.#findAuditLog(guild, user.id, Eris.AuditLogActionType.MEMBER_BAN_REMOVE);
        await this.modLog.logUnban(guild, user, log?.user, util.literal(log?.reason ?? undefined));
    }

    public async userLeft(member: Eris.Member): Promise<void> {
        if (this.#ignoreLeaves.delete(`${member.guild.id}:${member.id}`))
            return;

        const log = await this.#findAuditLog(member.guild, member.id, Eris.AuditLogActionType.MEMBER_KICK);
        if (log === undefined) // no kick audit log, so they probably just left. Dont log.
            return;

        await this.modLog.logKick(member.guild, member.user, log.user, util.literal(log.reason ?? undefined));
    }

    async #findAuditLog(guild: Eris.Guild, targetId: string, type: Eris.AuditLogActionType): Promise<Eris.GuildAuditLogEntry | undefined> {
        const eventTime = moment().add(-30, 'seconds');
        await sleep(2000); // To ensure the audit log has appeared
        const auditLogs = await tryGetAuditLogs(guild, 50, undefined, type);
        return auditLogs?.entries
            .sort((a, b) => b.createdAt - a.createdAt)
            .find(log => log.targetID === targetId && moment(log.createdAt).isAfter(eventTime));
    }
}

async function tryGetAuditLogs(guild: Eris.Guild, limit?: number, before?: string, type?: Eris.AuditLogActionType): Promise<Eris.GuildAuditLog | undefined> {
    try {
        return await guild.getAuditLog({ limit, before, actionType: type });
    } catch (err: unknown) {
        if (err instanceof Eris.DiscordRESTError && err.code === Eris.ApiError.MISSING_PERMISSIONS)
            return undefined;
        throw err;
    }
}

const mapDuration = mapping.json(mapping.duration);
