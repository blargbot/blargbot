import { Cluster } from '@cluster';
import { defaultStaff } from '@cluster/utils';
import { StoredGuildSettings } from '@core/types';
import { Guild } from 'eris';

import { ModerationManager } from '../ModerationManager';
import { ModLogManager } from './ModLogManager';

export abstract class ModerationManagerBase {
    protected get cluster(): Cluster { return this.manager.cluster; }
    protected get modLog(): ModLogManager { return this.manager.modLog; }

    public constructor(public readonly manager: ModerationManager) {
    }

    protected async checkModerator(guild: Guild, targetId: undefined, moderatorId: string, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined> {
        if (guild.ownerID === moderatorId)
            return undefined;

        const moderatorMember = guild.members.get(moderatorId);
        if (moderatorMember === undefined)
            return 'moderatorNoPerms';

        if (targetId !== undefined && !this.isModeratorHigher(guild, targetId, moderatorId))
            return 'moderatorTooLow';

        if (moderatorMember.permissions.has(permission))
            return undefined;

        const staff = await this.getStaffPerms(guild, overrideKey);
        if ((staff & moderatorMember.permissions.allow & ~moderatorMember.permissions.deny) === 0)
            return 'moderatorNoPerms';

        return undefined;
    }

    protected isModeratorHigher(guild: Guild, targetId: string, moderatorId: string): boolean {
        if (guild.ownerID === moderatorId)
            return true;

        if (guild.ownerID === targetId)
            return false;

        const moderatorMember = guild.members.get(moderatorId);
        if (moderatorMember === undefined)
            return false;

        const targetMember = guild.members.get(targetId);
        if (targetMember === undefined)
            return true;

        return this.cluster.util.getPosition(targetMember) < this.cluster.util.getPosition(moderatorMember);
    }

    private async getStaffPerms(guild: Guild, overrideKey?: keyof StoredGuildSettings): Promise<number> {
        if (overrideKey === undefined)
            return defaultStaff;

        const settingValue = await this.cluster.database.guilds.getSetting(guild.id, overrideKey);
        if (typeof settingValue === 'number' && settingValue !== 0)
            return settingValue;

        return defaultStaff;
    }
}
