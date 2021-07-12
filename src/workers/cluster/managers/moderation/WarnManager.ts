import { Member, User } from 'eris';
import { ModerationType, WarnDetails, WarnResult } from '../../core';
import { ModerationManager } from '../ModerationManager';
import { ModerationManagerBase } from './ModerationManagerBase';

export class WarnManager extends ModerationManagerBase {
    public constructor(manager: ModerationManager) {
        super(manager);
    }

    public async warn(member: Member, moderator: User, count: number, reason?: string): Promise<WarnResult> {
        if (count === 0)
            return { type: ModerationType.WARN, count: 0, state: 'countZero' };
        if (count < 0)
            return { type: ModerationType.WARN, count: 0, state: 'countNegative' };
        if (isNaN(count))
            return { type: ModerationType.WARN, count: 0, state: 'countNaN' };

        const warnings = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;
        const banAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'banat') ?? Infinity;
        const kickAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'kickat') ?? Infinity;
        let newCount = Math.max(0, warnings + Math.max(count, 0));
        let result: WarnResult = {
            type: ModerationType.WARN,
            count: newCount,
            state: 'success'
        };

        await this.modLog.logWarn(member.guild, member.user, count, newCount, moderator, reason);

        if (banAt > 0 && newCount >= banAt) {
            result = {
                type: ModerationType.BAN,
                state: await this.manager.bans.ban(member.guild, member.user, moderator, true, undefined, `[ Auto-Ban ] Exceeded Warning Limit (${count}/${banAt})`),
                count: newCount
            };
            if (result.state === 'success')
                newCount = 0;
        } else if (kickAt > 0 && newCount >= kickAt) {
            result = {
                type: ModerationType.KICK,
                state: await this.manager.bans.kick(member, moderator, true, `[ Auto-Kick ] Exceeded warning limit (${count}/${kickAt})`),
                count: newCount
            };
        }

        await this.cluster.database.guilds.setWarnings(member.guild.id, member.id, newCount <= 0 ? undefined : newCount);
        return result;
    }

    public async pardon(member: Member, moderator: User, count: number, reason?: string): Promise<number | 'countNaN' | 'countNegative' | 'countZero'> {
        if (count === 0)
            return 'countZero';
        if (count < 0)
            return 'countNegative';
        if (isNaN(count))
            return 'countNaN';

        const oldWarnings = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;
        const newCount = Math.max(0, oldWarnings - Math.max(count, 0));

        await this.modLog.logPardon(member.guild, member.user, count, newCount, moderator, reason);
        await this.cluster.database.guilds.setWarnings(member.guild.id, member.id, newCount === 0 ? undefined : newCount);

        return newCount;
    }

    public async details(member: Member): Promise<WarnDetails> {
        const count = await this.cluster.database.guilds.getWarnings(member.guild.id, member.id) ?? 0;
        const banAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'banat');
        const kickAt = await this.cluster.database.guilds.getSetting(member.guild.id, 'kickat');

        return {
            count: count,
            banAt: banAt === undefined || banAt <= 0 ? undefined : banAt,
            kickAt: kickAt === undefined || kickAt <= 0 ? undefined : kickAt
        };
    }
}
