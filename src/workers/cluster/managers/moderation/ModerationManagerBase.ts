import { Cluster } from '@cluster';
import { defaultStaff } from '@cluster/utils';
import { StoredGuildSettings } from '@core/types';
import { Guild, PermissionResolvable, PermissionString } from 'discord.js';

import { ModerationManager } from '../ModerationManager';
import { ModLogManager } from './ModLogManager';

export abstract class ModerationManagerBase {
    protected get cluster(): Cluster { return this.manager.cluster; }
    protected get modLog(): ModLogManager { return this.manager.modLog; }

    public constructor(public readonly manager: ModerationManager) {
    }

    protected async checkModerator(guild: Guild, targetId: undefined, moderatorId: string, permission: PermissionString, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: PermissionString, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: PermissionString, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined> {
        if (guild.ownerId === moderatorId)
            return undefined;

        const moderatorMember = await this.cluster.util.getMember(guild, moderatorId);
        if (moderatorMember === undefined)
            return 'moderatorNoPerms';

        if (targetId !== undefined && !await this.isModeratorHigher(guild, targetId, moderatorId))
            return 'moderatorTooLow';

        if (moderatorMember.permissions.has(permission))
            return undefined;

        const staff = await this.getStaffPerms(guild, overrideKey);
        if (!moderatorMember.permissions.any(staff))
            return 'moderatorNoPerms';

        return undefined;
    }

    protected async isModeratorHigher(guild: Guild, targetId: string, moderatorId: string): Promise<boolean> {
        if (guild.ownerId === moderatorId)
            return true;

        if (guild.ownerId === targetId)
            return false;

        const moderatorMember = await this.cluster.util.getMember(guild, moderatorId);
        if (moderatorMember === undefined)
            return false;

        const targetMember = await this.cluster.util.getMember(guild, targetId);
        if (targetMember === undefined)
            return true;

        return this.cluster.util.getPosition(targetMember) < this.cluster.util.getPosition(moderatorMember);
    }

    private async getStaffPerms(guild: Guild, overrideKey?: keyof StoredGuildSettings): Promise<PermissionResolvable> {
        if (overrideKey === undefined)
            return defaultStaff;

        const settingValue = await this.cluster.database.guilds.getSetting(guild.id, overrideKey);
        if (typeof settingValue === 'number' && settingValue !== 0)
            return BigInt(Math.floor(settingValue));

        return defaultStaff;
    }
}
