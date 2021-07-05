import { Guild, Member, User } from 'eris';
import { Cluster } from '../../Cluster';
import { defaultStaff, Modlog, StoredGuildSettings } from '../../core';
import { ModerationManager } from '../ModerationManager';

export abstract class ModerationManagerBase {
    protected get cluster(): Cluster { return this.manager.cluster; }
    protected get modlog(): Modlog { return this.manager.modlog; }

    public constructor(public readonly manager: ModerationManager) {
    }

    protected async checkModerator(target: undefined, guild: Guild, moderator: User, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | undefined>;
    protected async checkModerator(target: Member | undefined, guild: Guild, moderator: User, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined>;
    protected async checkModerator(target: Member | undefined, guild: Guild, moderator: User, permission: string, overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined> {
        const member = guild.members.get(moderator.id);
        if (member === undefined)
            return 'moderatorNoPerms';

        if (guild.ownerID === member.id)
            return undefined;

        if (target !== undefined && this.cluster.util.getPosition(target) > this.cluster.util.getPosition(member))
            return 'moderatorTooLow';

        if (member.permissions.has(permission))
            return undefined;

        const staff = await this.getStaffPerms(guild, overrideKey);
        if ((staff & member.permissions.allow & ~member.permissions.deny) === 0)
            return 'moderatorNoPerms';

        return undefined;
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
