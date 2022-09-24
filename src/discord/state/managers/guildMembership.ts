import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { DiscordStateManager } from './discord';
import { GuildStateManager } from './guild';
import { GuildRoleMembershipStateManager } from './guildRoleMembership';
import { UserStateManager } from './user';

export type GuildMembershipInit = discord.GatewayGuildMemberAddDispatchData & { user: discord.APIUser; };
// eslint-disable-next-line @typescript-eslint/naming-convention
export type GuildMembershipState = discord.APIGuildMember & { guild_id: string; user_id: string; }
export type GuildMembershipUpdate = discord.GatewayGuildMemberUpdateDispatchData;

export class GuildMembershipsStateManager extends StateManagerCollection<GuildMembershipStateManager, GuildMembershipInit, GuildMembershipState, GuildMembershipUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: GuildMembershipStateManager,
            indexes: ['guild', 'user'],
            createNew() {
                return new GuildMembershipStateManager(root);
            },
            getId(state) {
                const userId = 'user_id' in state ? state.user_id : state.user.id;
                return `${state.guild_id}:${userId}`;
            }
        });
    }
}

export class GuildMembershipStateManager extends StateManagerBase<GuildMembershipStateManager, GuildMembershipInit, GuildMembershipState, GuildMembershipUpdate> {
    readonly #root: DiscordStateManager;

    public get state(): GuildMembershipState { return this.notInitialized(); }
    public get guild(): GuildStateManager { return this.notInitialized(); }
    public get user(): UserStateManager { return this.notInitialized(); }
    public get roles(): ReadonlyMap<string, GuildRoleMembershipStateManager> { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'guild': init => root.guilds.get(init.guild_id),
            'user': init => root.users.upsert(init.user),
            'roles': () => root.guildRoleMemberships.getIndex('membership', this)
        });
        this.#root = root;
    }

    protected getInitialState(init: GuildMembershipInit): GuildMembershipState {
        return { ...init, user_id: init.user.id };
    }

    public init(init: GuildMembershipInit): void {
        this.#root.guildRoleMemberships.create({ // @everyone
            guildId: init.guild_id,
            user: init.user,
            roleId: init.guild_id
        });
        for (const role of init.roles) {
            this.#root.guildRoleMemberships.create({
                guildId: init.guild_id,
                user: init.user,
                roleId: role
            });
        }
        super.init(init);
    }

    protected updateState(current: GuildMembershipState, update: GuildMembershipUpdate): GuildMembershipState {
        global.console.log('Guild member update', update);
        return current;
    }
}
