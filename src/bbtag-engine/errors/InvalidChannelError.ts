import { ChannelType } from '../enums.js';
import { BBTagRuntimeError } from './BBTagRuntimeError.js';

const errorMessages: Record<ChannelType, string> = {
    [ChannelType.GUILD_VOICE]: 'Channel cannot be a voice channel',
    [ChannelType.GUILD_STAGE_VOICE]: 'Channel cannot be a stage channel',
    [ChannelType.GUILD_CATEGORY]: 'Channel cannot be a category',
    [ChannelType.GUILD_DIRECTORY]: 'Channel cannot be a directory channel',
    [ChannelType.GUILD_FORUM]: 'Channel cannot be a forum channel',
    [ChannelType.PRIVATE_THREAD]: 'Channel cannot be a thread channel',
    [ChannelType.PUBLIC_THREAD]: 'Channel cannot be a thread channel',
    [ChannelType.ANNOUNCEMENT_THREAD]: 'Channel cannot be a thread channel',
    [ChannelType.GUILD_ANNOUNCEMENT]: 'Channel cannot be a news channel',
    [ChannelType.GUILD_TEXT]: 'Channel cannot be a text channel',
    [ChannelType.DM]: 'Channel cannot be a dm channel',
    [ChannelType.GROUP_DM]: 'Channel cannot be a group dm channel',
    [ChannelType.GUILD_MEDIA]: 'Channel cannot be a media channel'
};

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channelType: ChannelType, channelId: string) {
        super(errorMessages[channelType], `The channel ${channelId} is not a valid type`);
    }
}
