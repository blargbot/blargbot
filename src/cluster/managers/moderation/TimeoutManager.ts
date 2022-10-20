import { TimeoutClearResult, TimeoutResult } from '@blargbot/cluster/types';
import { clampBy } from '@blargbot/cluster/utils';
import { format, IFormattable } from '@blargbot/domain/messages/types';
import { Guild, Member, User } from 'eris';
import moment, { Duration } from 'moment-timezone';

import templates from '../../text';
import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

const maximumTimeoutDuration = moment.duration(28, `d`).subtract(10, `s`); //Discord throws a RESTError when the duration is too close to 28d

export class TimeoutManager extends ModerationManagerBase {
    readonly #ignoreTimeouts: Set<`${string}:${string}`>;
    readonly #ignoreTimeoutClears: Set<`${string}:${string}`>;

    public constructor(manager: ModerationManager) {
        super(manager);
        this.#ignoreTimeouts = new Set();
        this.#ignoreTimeoutClears = new Set();
    }

    public async timeout(member: Member, moderator: User, authorizer: User, duration: Duration, reason?: IFormattable<string>): Promise<TimeoutResult> {
        const guild = member.guild;
        const result = await this.#updateUserTimeoutDate(guild, member.id, moderator, authorizer, duration, reason);
        if (result !== `success`) {
            if (typeof result === `string`)
                return result;
            throw result.error;
        }

        await this.modLog.logTimeout(guild, member.user, duration, moderator, reason);

        return `success`;
    }

    public async clearTimeout(member: Member, moderator: User, authorizer: User, reason?: IFormattable<string>): Promise<TimeoutClearResult> {
        if (member.communicationDisabledUntil === null)
            return `notTimedOut`;

        const guild = member.guild;

        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`moderateMembers`) !== true)
            return `noPerms`;

        const permMessage = await this.checkModerator(guild, undefined, authorizer.id, `moderateMembers`, `timeoutoverride`);
        if (permMessage !== undefined)
            return permMessage;

        this.#ignoreTimeoutClears.add(`${guild.id}:${member.id}`);
        const formatter = await this.manager.cluster.util.getFormatter(guild);
        await guild.editMember(member.id, { communicationDisabledUntil: null }, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        await this.modLog.logTimeoutClear(guild, member.user, moderator, reason);

        return `success`;
    }

    async #updateUserTimeoutDate(guild: Guild, userId: string, moderator: User, authorizer: User, duration: Duration, reason?: IFormattable<string>): Promise<TimeoutResult | { error: unknown; }> {
        const self = guild.members.get(this.cluster.discord.user.id);
        if (self?.permissions.has(`moderateMembers`) !== true) {
            return `noPerms`;
        }

        const permMessage = await this.checkModerator(guild, userId, authorizer.id, `moderateMembers`, `timeoutoverride`);
        if (permMessage !== undefined)
            return permMessage;

        const member = await this.cluster.util.getMember(guild, userId);
        if (member !== undefined && !this.cluster.util.isBotHigher(member))
            return `memberTooHigh`;

        if (member?.communicationDisabledUntil !== null && moment(member?.communicationDisabledUntil) > moment())
            return `alreadyTimedOut`;

        this.#ignoreTimeouts.add(`${guild.id}:${userId}`);
        try {
            const clampedDuration = clampBy(duration, moment.duration(0), maximumTimeoutDuration, d => d.asMilliseconds());
            const formatter = await this.manager.cluster.util.getFormatter(guild);
            await guild.editMember(userId, { communicationDisabledUntil: moment().utc().add(clampedDuration).toDate() }, templates.moderation.auditLog({ moderator, reason })[format](formatter));
        } catch (err: unknown) {
            this.#ignoreTimeouts.delete(`${guild.id}:${userId}`);
            return { error: err };
        }
        return `success`;
    }

    public async userTimedOut(guild: Guild, user: User, duration: Duration): Promise<void> {
        if (!this.#ignoreTimeouts.delete(`${guild.id}:${user.id}`))
            await this.modLog.logTimeout(guild, user, duration);
    }

    public async userTimeoutCleared(guild: Guild, user: User): Promise<void> {
        if (!this.#ignoreTimeoutClears.delete(`${guild.id}:${user.id}`))
            await this.modLog.logTimeoutClear(guild, user);
    }
}
