import { humanize } from '@cluster/utils';
import { KnownChannel } from 'discord.js';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channel: KnownChannel) {
        super(InvalidChannelError.getMessage(channel), `The channel ${humanize.channelName(channel)} (${channel.id}) is not a valid type`);
    }

    private static getMessage(channel: KnownChannel): string {
        switch (channel.type) {
            case 'GUILD_VOICE':
                return 'Channel cannot be a voice channel';
            case 'GUILD_STAGE_VOICE':
                return 'Channel cannot be a stage channel';
            case 'GUILD_CATEGORY':
                return 'Channel cannot be a category';
            case 'GUILD_STORE':
                return 'Channel cannot be a store channel';
            case 'GUILD_PRIVATE_THREAD':
            case 'GUILD_PUBLIC_THREAD':
            case 'GUILD_NEWS_THREAD':
                return 'Channel cannot be a thread channel';
            case 'GUILD_NEWS':
                return 'Channel cannot be a news channel';
            case 'GUILD_TEXT':
                return 'Channel cannot be a text channel';
            case 'DM':
                return 'Channel cannot be a dm channel';
            case 'GROUP_DM':
                return 'Channel cannot be a group dm channel';
        }
    }
}
