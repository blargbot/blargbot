import type discord from 'discord-api-types/v10';

import { StateManagerBase, StateManagerCollection } from '../core';
import { DiscordStateManager } from './discord';
import { GuildStateManager } from './guild';
import { MessageStateManager } from './message';

// eslint-disable-next-line @typescript-eslint/naming-convention
export type ChannelInit = discord.APIChannel & { guild_id?: string; };
export type ChannelState = discord.APIChannel;
export type ChannelUpdate = discord.APIChannel;

export class ChannelsStateManager extends StateManagerCollection<ChannelStateManager, ChannelInit, ChannelState, ChannelUpdate> {
    public constructor(root: DiscordStateManager) {
        super({
            type: ChannelStateManager,
            indexes: ['guild'],
            createNew() {
                return new ChannelStateManager(root);
            },
            getId(state) {
                return state.id;
            }
        });
    }
}

export class ChannelStateManager extends StateManagerBase<ChannelStateManager, ChannelInit, ChannelState, ChannelUpdate> {
    public get guild(): GuildStateManager | undefined { return this.notInitialized(); }
    public get messages(): ReadonlyMap<string, MessageStateManager> { return this.notInitialized(); }

    public constructor(root: DiscordStateManager) {
        super({
            'guild': init => init.guild_id === undefined ? undefined : root.guilds.get(init.guild_id),
            'messages': () => root.messages.getIndex('channel', this)
        });
    }

    protected getInitialState(init: ChannelInit): ChannelState {
        return { ...init };
    }

    protected updateState(current: ChannelState, update: ChannelUpdate): ChannelState {
        global.console.log('Channel update', update);
        return current;
    }
}
