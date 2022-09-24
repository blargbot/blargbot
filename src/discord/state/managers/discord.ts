import type discord from 'discord-api-types/v10';
import { GatewayDispatchEvents } from 'discord-api-types/v10';

import { ChannelsStateManager } from './channel';
import { GuildsStateManager } from './guild';
import { GuildMembershipInit, GuildMembershipsStateManager } from './guildMembership';
import { GuildRoleMembershipsStateManager } from './guildRoleMembership';
import { MessagesStateManager } from './message';
import { RolesStateManager } from './role';
import { UsersStateManager, UserStateManager } from './user';

export type GatewayDispatchEventTypes = {
    [P in discord.GatewayDispatchPayload as P['t']]: P
}

export interface GatewayEventDispatcher {
    on<T extends keyof GatewayDispatchEventTypes>(event: T, handler: (data: GatewayDispatchEventTypes[T]) => void): void;
}

export class DiscordStateManager {
    public get self(): UserStateManager {
        throw new Error('No ready event has been fired yet.');
    }

    public readonly guilds: GuildsStateManager;
    public readonly channels: ChannelsStateManager;
    public readonly roles: RolesStateManager;
    public readonly messages: MessagesStateManager;
    public readonly users: UsersStateManager;
    public readonly guildMemberships: GuildMembershipsStateManager;
    public readonly guildRoleMemberships: GuildRoleMembershipsStateManager;

    public constructor() {
        this.users = new UsersStateManager(this);
        this.guilds = new GuildsStateManager(this);
        this.channels = new ChannelsStateManager(this);
        this.roles = new RolesStateManager(this);
        this.messages = new MessagesStateManager(this);
        this.guildMemberships = new GuildMembershipsStateManager(this);
        this.guildRoleMemberships = new GuildRoleMembershipsStateManager(this);
    }

    public listenTo(source: GatewayEventDispatcher): void {
        source.on(GatewayDispatchEvents.Ready, packet => Object.defineProperty(this, 'self', { value: this.users.upsert(packet.d.user) }));
        source.on(GatewayDispatchEvents.GuildCreate, packet => this.guilds.create(packet.d));
        source.on(GatewayDispatchEvents.GuildUpdate, packet => this.guilds.update(packet.d));
        source.on(GatewayDispatchEvents.GuildDelete, packet => this.guilds.delete(packet.d.id));
        source.on(GatewayDispatchEvents.ChannelCreate, packet => this.channels.create(packet.d));
        source.on(GatewayDispatchEvents.ChannelUpdate, packet => this.channels.update(packet.d));
        source.on(GatewayDispatchEvents.ChannelDelete, packet => this.channels.delete(packet.d.id));
        source.on(GatewayDispatchEvents.GuildRoleCreate, packet => this.roles.create(packet.d));
        source.on(GatewayDispatchEvents.GuildRoleUpdate, packet => this.roles.update(packet.d));
        source.on(GatewayDispatchEvents.GuildRoleDelete, packet => this.roles.delete(packet.d.role_id));
        source.on(GatewayDispatchEvents.MessageCreate, packet => this.messages.create(packet.d));
        source.on(GatewayDispatchEvents.MessageUpdate, packet => this.messages.tryUpdate(packet.d));
        source.on(GatewayDispatchEvents.MessageDelete, packet => this.messages.delete(packet.d.id));
        source.on(GatewayDispatchEvents.GuildMemberAdd, packet => this.guildMemberships.create(packet.d as GuildMembershipInit));
        source.on(GatewayDispatchEvents.GuildMemberUpdate, packet => this.guildMemberships.upsert(packet.d as GuildMembershipInit));
        source.on(GatewayDispatchEvents.GuildMemberRemove, packet => this.guildMemberships.delete(`${packet.d.guild_id}:${packet.d.user.id}`));
        source.on(GatewayDispatchEvents.UserUpdate, packet => this.users.upsert(packet.d));

        source.on(GatewayDispatchEvents.GuildMembersChunk, packet => {
            for (const member of packet.d.members as GuildMembershipInit[]) {
                member.guild_id = packet.d.guild_id;
                this.guildMemberships.upsert(member);
            }
        });
    }
}
