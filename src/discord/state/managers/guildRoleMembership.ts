import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { DiscordStateManager } from './discord';
import { GuildStateManager } from './guild';
import { GuildMembershipStateManager } from './guildMembership';
import { RoleStateManager } from './role';
import { UserStateManager } from './user';

export type GuildRoleMembershipInit = { guildId: string; roleId: string; user: discord.APIUser; };
export type GuildRoleMembershipState = { guildId: string; roleId: string; user: discord.APIUser; }
export type GuildRoleMembershipUpdate = never;

export class GuildRoleMembershipsStateManager extends StateManagerCollection<GuildRoleMembershipStateManager, GuildRoleMembershipInit, GuildRoleMembershipState, GuildRoleMembershipUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: GuildRoleMembershipStateManager,
            indexes: ['role', 'membership'],
            createNew() {
                return new GuildRoleMembershipStateManager(root);
            },
            getId(state) {
                return `${state.guildId}:${state.roleId}:${state.user.id}`;
            }
        });
    }
}

export class GuildRoleMembershipStateManager extends StateManagerBase<GuildRoleMembershipStateManager, GuildRoleMembershipInit, GuildRoleMembershipState, GuildRoleMembershipUpdate> {
    public get user(): UserStateManager { return this.notInitialized(); }
    public get guild(): GuildStateManager { return this.notInitialized(); }
    public get membership(): GuildMembershipStateManager { return this.notInitialized(); }
    public get role(): RoleStateManager { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            role: init => root.roles.get(init.roleId),
            user: init => root.users.upsert(init.user),
            guild: init => root.guilds.get(init.guildId),
            membership: init => root.guildMemberships.get(`${init.guildId}:${init.user.id}`)
        });
    }

    protected getInitialState(init: GuildRoleMembershipInit): GuildRoleMembershipState {
        return { ...init };
    }

    protected updateState(): GuildRoleMembershipState {
        throw new Error('Not supported');
    }
}
