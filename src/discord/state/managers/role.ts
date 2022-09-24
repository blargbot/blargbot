import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { DiscordStateManager } from './discord';
import { GuildStateManager } from './guild';
import { GuildRoleMembershipStateManager } from './guildRoleMembership';

export type RoleInit = discord.GatewayGuildRoleCreateDispatchData;
export type RoleState = discord.APIRole
export type RoleUpdate = discord.GatewayGuildRoleModifyDispatchData;

export class RolesStateManager extends StateManagerCollection<RoleStateManager, RoleInit, RoleState, RoleUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: RoleStateManager,
            indexes: ['guild'],
            createNew() {
                return new RoleStateManager(root);
            },
            getId(state) {
                return 'id' in state ? state.id : state.role.id;
            }
        });
    }
}

export class RoleStateManager extends StateManagerBase<RoleStateManager, RoleInit, RoleState, RoleUpdate> {
    public get guild(): GuildStateManager { return this.notInitialized(); }
    public get memberships(): ReadonlyMap<string, GuildRoleMembershipStateManager> { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'memberships': () => root.guildRoleMemberships.getIndex('role', this),
            'guild': init => root.guilds.get(init.guild_id)
        });
    }

    protected getInitialState(init: RoleInit): RoleState {
        return { ...init.role };
    }

    protected updateState(current: RoleState, update: RoleUpdate): RoleState {
        return { ...current, ...update };
    }
}
