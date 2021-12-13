import { humanize } from '@cluster/utils';
import { Constants, KnownChannel } from 'eris';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channel: KnownChannel) {
        super(InvalidChannelError.getMessage(channel), `The channel ${humanize.channelName(channel)} (${channel.id}) is not a valid type`);
    }

    private static getMessage(channel: KnownChannel): string {
        switch (channel.type) {
            case Constants.ChannelTypes.GUILD_VOICE:
                return 'Channel cannot be a voice channel';
            case Constants.ChannelTypes.GUILD_STAGE_VOICE:
                return 'Channel cannot be a stage channel';
            case Constants.ChannelTypes.GUILD_CATEGORY:
                return 'Channel cannot be a category';
            case Constants.ChannelTypes.GUILD_STORE:
                return 'Channel cannot be a store channel';
            case Constants.ChannelTypes.GUILD_PRIVATE_THREAD:
            case Constants.ChannelTypes.GUILD_PUBLIC_THREAD:
            case Constants.ChannelTypes.GUILD_NEWS_THREAD:
                return 'Channel cannot be a thread channel';
            case Constants.ChannelTypes.GUILD_NEWS:
                return 'Channel cannot be a news channel';
            case Constants.ChannelTypes.GUILD_TEXT:
                return 'Channel cannot be a text channel';
            case Constants.ChannelTypes.DM:
                return 'Channel cannot be a dm channel';
            case Constants.ChannelTypes.GROUP_DM:
                return 'Channel cannot be a group dm channel';
        }
    }
}
