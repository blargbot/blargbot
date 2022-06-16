import { TimeoutResult, UnTimeoutResult } from '@blargbot/cluster/types';
import { humanize } from '@blargbot/cluster/utils';
import { Guild, Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class TimeoutManager extends ModerationManagerBase {
    private readonly ignoreTimeouts: Set<`${string}:${string}`>;
    private readonly ignoreUnTimeouts: Set<`${string}:${string}`>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.ignoreTimeouts = new Set();
        this.ignoreUnTimeouts = new Set();
    }

    public async timeout(member: Member, moderator: User, authorizer: User, duration: Duration, reason: string): Promise<TimeoutResult> {
        const guild = member.guild;
        const result = await this.tryTimeoutUser(guild, member.id, moderator, authorizer, duration, reason);
        if (result !== 'success') {
            if (typeof result === 'string')
                return result;
            throw result.error;
        }

        await this.modLog.logTimeout(guild, member.user, duration, moderator, reason);

        return 'success';
    }

    public async removeTimeout(member: Member, moderator: User, authorizer: User, reason: string): Promise<UnTimeoutResult> {
        if (member.communicationDisabledUntil === null)
            return 'notTimedOut';

        const guild = member.guild;

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('moderateMembers') !== true)
            return 'noPerms';

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, 'moderateMembers', 'timeoutoverride');
        if (permMessage !== undefined)
            return permMessage;

        this.ignoreUnTimeouts.add(`${guild.id}:${member.id}`);
        await guild.editMember(member.id, { communicationDisabledUntil: null }, `[${humanize.fullName(moderator)}] ${reason}`);
        await this.modLog.logUnTimeout(guild, member.user, moderator, reason);

        return 'success';
    }

    private async tryTimeoutUser(guild: Guild, userId: string, moderator: User, authorizer: User, duration: Duration, reason: string): Promise<TimeoutResult | { error: unknown; }> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has('moderateMembers') !== true) {
            return 'noPerms';
        }

        const permMessage = await this.checkModerator(guild, userId, authorizer.id, 'moderateMembers', 'timeoutoverride');
        if (permMessage !== undefined)
            return permMessage;

        const member = await this.cluster.util.getMember(guild, userId);
        if (member !== undefined && !this.cluster.util.isBotHigher(member))
            return 'memberTooHigh';

        if (member?.communicationDisabledUntil !== null && moment(member?.communicationDisabledUntil) > moment())
            return 'alreadyTimedOut';

        this.ignoreTimeouts.add(`${guild.id}:${userId}`);
        try {
            await guild.editMember(userId, { communicationDisabledUntil: moment().add(duration).toDate() }, `[${humanize.fullName(moderator)}] ${reason}`);
        } catch (err: unknown) {
            this.ignoreTimeouts.delete(`${guild.id}:${userId}`);
            return { error: err };
        }
        return 'success';
    }

    public async userTimedOut(guild: Guild, user: User, duration: Duration): Promise<void> {
        if (!this.ignoreTimeouts.delete(`${guild.id}:${user.id}`))
            await this.modLog.logTimeout(guild, user, duration);
    }

    public async userUnTimedOut(guild: Guild, user: User): Promise<void> {
        if (!this.ignoreUnTimeouts.delete(`${guild.id}:${user.id}`))
            await this.modLog.logUnTimeout(guild, user);
    }
}
