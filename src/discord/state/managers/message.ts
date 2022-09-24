import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { ChannelStateManager } from './channel';
import { DiscordStateManager } from './discord';
import { GuildMembershipStateManager } from './guildMembership';
import { UserStateManager } from './user';

export type MessageInit = discord.GatewayMessageCreateDispatchData;
export type MessageState = discord.APIMessage
export type MessageUpdate = discord.GatewayMessageUpdateDispatchData;

export class MessagesStateManager extends StateManagerCollection<MessageStateManager, MessageInit, MessageState, MessageUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: MessageStateManager,
            indexes: ['channel', 'author'],
            createNew() {
                return new MessageStateManager(root);
            },
            getId(state) {
                return state.id;
            }
        });
    }
}

export class MessageStateManager extends StateManagerBase<MessageStateManager, MessageInit, MessageState, MessageUpdate> {
    public get channel(): ChannelStateManager { return this.notInitialized(); }
    public get author(): UserStateManager { return this.notInitialized(); }
    public get membership(): GuildMembershipStateManager | undefined { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'channel': init => root.channels.get(init.channel_id),
            'author': init => root.users.upsert(init.author),
            'membership': init => init.member === undefined || init.guild_id === undefined ? undefined : root.guildMemberships.upsert({
                ...init.member,
                guild_id: init.guild_id,
                user: init.author
            })
        });
    }

    protected getInitialState(init: MessageInit): MessageState {
        return { ...init };
    }

    protected updateState(current: MessageState, update: MessageUpdate): MessageState {
        return { ...current, ...update };
    }
}
