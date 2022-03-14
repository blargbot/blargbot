import { ChannelType } from 'discord-api-types';

import { BBTagRuntimeError } from './BBTagRuntimeError';

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channelType: ChannelType, channelId: string) {
        super(InvalidChannelError.getMessage(channelType), `The channel ${channelId} is not a valid type`);
    }

    private static getMessage(channelType: ChannelType): string {
        switch (channelType) {
            case ChannelType.GuildVoice:
                return 'Channel cannot be a voice channel';
            case ChannelType.GuildStageVoice:
                return 'Channel cannot be a stage channel';
            case ChannelType.GuildCategory:
                return 'Channel cannot be a category';
            case ChannelType.GuildStore:
                return 'Channel cannot be a store channel';
            case ChannelType.GuildPrivateThread:
            case ChannelType.GuildPublicThread:
            case ChannelType.GuildNewsThread:
                return 'Channel cannot be a thread channel';
            case ChannelType.GuildNews:
                return 'Channel cannot be a news channel';
            case ChannelType.GuildText:
                return 'Channel cannot be a text channel';
            case ChannelType.DM:
                return 'Channel cannot be a dm channel';
            case ChannelType.GroupDM:
                return 'Channel cannot be a group dm channel';
        }
    }
}
