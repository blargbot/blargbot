import { PardonResult, WarnDetails, WarnResult } from '@blargbot/cluster/types';
import { ModerationType } from '@blargbot/cluster/utils';
import { IFormattable } from '@blargbot/formatting';
import Eris from 'eris';
import moment from 'moment-timezone';

import templates from '../../text';
import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class WarnManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async warn(member: Eris.Member, moderator: Eris.User, authorizer: Eris.User, count: number, reason?: IFormattable<string>): Promise<WarnResult> {
        if (count === 0)
            return { type: ModerationType.WARN, warnings: 0, state: 'countZero' };
        if (count < 0)
            return { type: ModerationType.WARN, warnings: 0, state: 'countNegative' };
        if (isNaN(count))
            return { type: ModerationType.WARN, warnings: 0, state: 'countNaN' };

        const oldCount = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;
        const banAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'banat') ?? Infinity;
        const kickAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'kickat') ?? Infinity;
        const timeoutAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'timeoutat') ?? Infinity;
        const duration = moment.duration(1, 'd');

        const actOnLimitsOnly = await this.cluster.database.guilds.getSetting(member.guild.id, 'actonlimitsonly') ?? false;
        let newCount = Math.max(0, oldCount + Math.max(count, 0));
        let result: WarnResult = {
            type: ModerationType.WARN,
            warnings: newCount,
            state: 'success'
        };

        await this.modLog.logWarn(member.guild, member.user, count, newCount, moderator, reason);

        if (banAt > 0 && (!actOnLimitsOnly || oldCount < banAt) && newCount >= banAt) {
            result = {
                type: ModerationType.BAN,
                state: await this.manager.bans.ban(member.guild, member.user, moderator, authorizer, 1, templates.warning.autoBan({ warnings: newCount, limit: banAt }), moment.duration(Infinity)),
                warnings: newCount
            };
            if (result.state === 'success')
                newCount = 0;
        } else if (kickAt > 0 && (!actOnLimitsOnly || oldCount < kickAt) && newCount >= kickAt) {
            result = {
                type: ModerationType.KICK,
                state: await this.manager.bans.kick(member, moderator, authorizer, templates.warning.autoKick({ warnings: newCount, limit: kickAt })),
                warnings: newCount
            };
        } else if (timeoutAt > 0 && (!actOnLimitsOnly || oldCount < timeoutAt) && newCount >= timeoutAt) {
            result = {
                type: ModerationType.TIMEOUT,
                state: await this.manager.timeouts.timeout(member, moderator, authorizer, duration, templates.warning.autoTimeout({ warnings: newCount, limit: timeoutAt })),
                warnings: newCount
            };
        }

        await this.cluster.database.guilds.setWarnings(member.guild.id, member.id, newCount <= 0 ? undefined : newCount);
        return result;
    }

    public async pardon(member: Eris.Member, moderator: Eris.User, count: number, reason?: IFormattable<string>): Promise<PardonResult> {
        const oldWarnings = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;

        if (count === 0)
            return { warnings: oldWarnings, state: 'countZero' };
        if (count < 0)
            return { warnings: oldWarnings, state: 'countNegative' };
        if (isNaN(count))
            return { warnings: oldWarnings, state: 'countNaN' };

        const newCount = Math.max(0, oldWarnings - Math.max(count, 0));

        await this.modLog.logPardon(member.guild, member.user, count, newCount, moderator, reason);
        await this.cluster.database.guilds.setWarnings(member.guild.id, member.id, newCount === 0 ? undefined : newCount);

        return { warnings: newCount, state: 'success' };
    }

    public async details(member: Eris.Member): Promise<WarnDetails> {
        const count = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;
        const banAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'banat');
        const kickAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'kickat');
        const timeoutAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'timeoutat');

        return {
            count: count,
            banAt: banAt === undefined || banAt <= 0 ? undefined : banAt,
            kickAt: kickAt === undefined || kickAt <= 0 ? undefined : kickAt,
            timeoutAt: timeoutAt === undefined || timeoutAt <= 0 ? undefined : timeoutAt
        };
    }
}
