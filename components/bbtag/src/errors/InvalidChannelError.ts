import Discord from 'discord-api-types/v9';

import { BBTagRuntimeError } from './BBTagRuntimeError.js';

const errorMessages: Record<Discord.ChannelType, string> = {
    [Discord.ChannelType.GuildVoice]: 'Channel cannot be a voice channel',
    [Discord.ChannelType.GuildStageVoice]: 'Channel cannot be a stage channel',
    [Discord.ChannelType.GuildCategory]: 'Channel cannot be a category',
    [Discord.ChannelType.GuildDirectory]: 'Channel cannot be a directory channel',
    [Discord.ChannelType.GuildForum]: 'Channel cannot be a forum channel',
    [Discord.ChannelType.PrivateThread]: 'Channel cannot be a thread channel',
    [Discord.ChannelType.PublicThread]: 'Channel cannot be a thread channel',
    [Discord.ChannelType.AnnouncementThread]: 'Channel cannot be a thread channel',
    [Discord.ChannelType.GuildAnnouncement]: 'Channel cannot be a news channel',
    [Discord.ChannelType.GuildText]: 'Channel cannot be a text channel',
    [Discord.ChannelType.DM]: 'Channel cannot be a dm channel',
    [Discord.ChannelType.GroupDM]: 'Channel cannot be a group dm channel'
};

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channelType: Discord.ChannelType, channelId: string) {
        super(errorMessages[channelType], `The channel ${channelId} is not a valid type`);
    }
}
