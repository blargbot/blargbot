import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { ChannelStateManager } from './channel';
import { DiscordStateManager } from './discord';
import { GuildMembershipInit, GuildMembershipStateManager } from './guildMembership';
import { RoleStateManager } from './role';

export type GuildInit = discord.GatewayGuildCreateDispatchData;
export type GuildState = discord.APIGuild
export type GuildUpdate = discord.APIGuild

export class GuildsStateManager extends StateManagerCollection<GuildStateManager, GuildInit, GuildState, GuildUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: GuildStateManager,
            indexes: [],
            createNew() {
                return new GuildStateManager(root);
            },
            getId(state) {
                return state.id;
            }
        });
    }
}

export class GuildStateManager extends StateManagerBase<GuildStateManager, GuildInit, GuildState, GuildUpdate> {
    readonly #root: DiscordStateManager;

    public get channels(): ReadonlyMap<string, ChannelStateManager> { return this.notInitialized(); }
    public get roles(): ReadonlyMap<string, RoleStateManager> { return this.notInitialized(); }
    public get memberships(): ReadonlyMap<string, GuildMembershipStateManager> { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'channels': () => root.channels.getIndex('guild', this),
            'memberships': () => root.guildMemberships.getIndex('guild', this),
            'roles': () => root.roles.getIndex('guild', this)
        });
        this.#root = root;
    }

    protected getInitialState(init: GuildInit): GuildState {
        return { ...init };
    }

    public override init(init: GuildInit): void {
        for (const role of init.roles)
            this.#root.roles.create({ guild_id: init.id, role });
        for (const channel of init.channels)
            this.#root.channels.create({ ...channel, guild_id: init.id });
        for (const member of init.members)
            this.#root.guildMemberships.create({ guild_id: init.id, ...member } as GuildMembershipInit);
        super.init(init);
    }

    protected updateState(current: GuildState, update: GuildUpdate): GuildState {
        return { ...current, ...update };
    }
}
