import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { DiscordStateManager } from './discord';
import { GuildMembershipStateManager } from './guildMembership';

export type UserInit = discord.APIUser;
export type UserState = discord.APIUser
export type UserUpdate = discord.GatewayUserUpdateDispatchData;

export class UsersStateManager extends StateManagerCollection<UserStateManager, UserInit, UserState, UserUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: UserStateManager,
            indexes: [],
            createNew() {
                return new UserStateManager(root);
            },
            getId(state) {
                return state.id;
            }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class UserStateManager extends StateManagerBase<UserStateManager, UserInit, UserState, UserUpdate> {
    public get memberships(): ReadonlyMap<string, GuildMembershipStateManager> { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'memberships': () => root.guildMemberships.getIndex('user', this)
        });
    }

    protected getInitialState(init: UserInit): UserState {
        return { ...init };
    }

    protected updateState(update: UserUpdate): UserState {
        return { ...update };
    }

}
