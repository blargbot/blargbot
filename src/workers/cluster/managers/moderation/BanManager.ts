import { Guild, Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';
import { Cluster } from '../../Cluster';
import { BanResult, humanize, KickResult, Modlog, UnbanEventOptions, UnbanResult } from '../../core';
import { ModerationManager } from '../ModerationManager';

export class BanManager {
    private readonly ignoreBans: Set<`${string}:${string}`>;
    private readonly ignoreUnbans: Set<`${string}:${string}`>;

    private get cluster(): Cluster { return this.manager.cluster; }
    private get modlog(): Modlog { return this.manager.modlog; }

    public constructor(public readonly manager: ModerationManager) {
        this.ignoreBans = new Set();
        this.ignoreUnbans = new Set();
    }

    public init(): void {
        this.cluster.timeouts.on('unban', event => void this.handleUnbanTimeout(event));
        this.cluster.discord.on('guildBanAdd', (guild, user) => void this.handleBanEvent(guild, user));
        this.cluster.discord.on('guildBanRemove', (guild, user) => void this.handleUnbanEvent(guild, user));
    }

    public async ban(member: Member, moderator: User, deleteDays = 1, reason?: string, duration?: Duration): Promise<BanResult> {
        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        if (!this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        this.ignoreBans.add(`${member.guild.id}:${member.id}`);
        await member.guild.banMember(member.id, deleteDays, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        if (duration === undefined) {
            await this.modlog.logBan(member.guild, member.user, moderator, reason);
        } else {
            await this.modlog.logSoftban(member.guild, member.user, duration, moderator, reason);
            await this.cluster.timeouts.insert('unban', {
                source: member.guild.id,
                guild: member.guild.id,
                user: member.id,
                duration: JSON.stringify(duration),
                endtime: moment().add(duration).toDate()
            });
        }
        return 'success';
    }

    public async kick(member: Member, moderator: User, reason?: string): Promise<KickResult> {
        const self = member.guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('kickMembers') !== true)
            return 'noPerms';

        if (!this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        await member.guild.kickMember(member.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modlog.logKick(member.guild, member.user, moderator, reason);
        return 'success';
    }

    public async unban(guild: Guild, user: User, moderator: User, reason?: string): Promise<UnbanResult> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('banMembers') !== true)
            return 'noPerms';

        this.ignoreUnbans.add(`${guild.id}:${user.id}`);
        await guild.unbanMember(user.id, `[${humanize.fullName(moderator)}] ${reason ?? ''}`);
        await this.modlog.logUnban(guild, user, moderator, reason);

        return 'success';
    }

    private async handleUnbanTimeout(event: UnbanEventOptions): Promise<void> {
        const guild = this.cluster.discord.guilds.get(event.guild);
        if (guild === undefined)
            return;

        const user = await this.cluster.util.getGlobalUser(event.user);
        if (user === undefined)
            return;

        const duration = moment.duration(event.duration);

        await this.unban(guild, user, this.cluster.discord.user, `Automatically unbanned after ${humanize.duration(duration)}.`);
    }

    private async handleBanEvent(guild: Guild, user: User): Promise<void> {
        if (!this.ignoreBans.delete(`${guild.id}:${user.id}`))
            await this.modlog.logBan(guild, user);
    }

    private async handleUnbanEvent(guild: Guild, user: User): Promise<void> {
        if (!this.ignoreUnbans.delete(`${guild.id}:${user.id}`))
            await this.modlog.logUnban(guild, user);
    }
}
