import { Cluster } from '@blargbot/cluster';
import { defaultStaff, discord, parse } from '@blargbot/cluster/utils';
import { StoredGuildSettings } from '@blargbot/domain/models';
import { Constants, Guild } from 'eris';

import { ModerationManager } from '../ModerationManager';
import { ModLogManager } from './ModLogManager';

export abstract class ModerationManagerBase {
    protected get cluster(): Cluster { return this.manager.cluster; }
    protected get modLog(): ModLogManager { return this.manager.modLog; }

    public constructor(public readonly manager: ModerationManager) {
    }

    protected async checkModerator(guild: Guild, targetId: undefined, moderatorId: string, permission: keyof Constants['Permissions'], overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: keyof Constants['Permissions'], overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined>;
    protected async checkModerator(guild: Guild, targetId: string | undefined, moderatorId: string, permission: keyof Constants['Permissions'], overrideKey?: keyof StoredGuildSettings): Promise<'moderatorNoPerms' | 'moderatorTooLow' | undefined> {
        if (guild.ownerID === moderatorId || moderatorId === this.cluster.discord.user.id)
            return undefined;

        const moderatorMember = await this.cluster.util.getMember(guild, moderatorId);
        if (moderatorMember === undefined)
            return 'moderatorNoPerms';

        if (targetId !== undefined && !await this.isModeratorHigher(guild, targetId, moderatorId))
            return 'moderatorTooLow';

        if (moderatorMember.permissions.has(permission))
            return undefined;

        const staff = await this.#getStaffPerms(guild, overrideKey);
        if (staff !== 0n && (moderatorMember.permissions.allow & staff) === 0n)
            return 'moderatorNoPerms';

        return undefined;
    }

    protected async isModeratorHigher(guild: Guild, targetId: string, moderatorId: string): Promise<boolean> {
        if (targetId === moderatorId)
            return true;

        if (guild.ownerID === moderatorId)
            return true;

        if (guild.ownerID === targetId)
            return false;

        const moderatorMember = await this.cluster.util.getMember(guild, moderatorId);
        if (moderatorMember === undefined)
            return false;

        const targetMember = await this.cluster.util.getMember(guild, targetId);
        if (targetMember === undefined)
            return true;

        return discord.getMemberPosition(targetMember) < discord.getMemberPosition(moderatorMember);
    }

    async #getStaffPerms(guild: Guild, overrideKey?: keyof StoredGuildSettings): Promise<bigint> {
        if (overrideKey === undefined)
            return defaultStaff;

        const settingValue = await this.cluster.database.guilds.getSetting(guild.id, overrideKey);
        switch (typeof settingValue) {
            case 'string':
            case 'number':
            case 'bigint': {
                const value = parse.bigInt(settingValue) ?? 0n;
                if (value !== 0n)
                    return value;
            }
        }
        return defaultStaff;
    }
}
