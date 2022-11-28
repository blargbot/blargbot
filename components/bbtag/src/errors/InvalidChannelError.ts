import discord from 'discord-api-types/v9';

import { BBTagRuntimeError } from './BBTagRuntimeError';

const errorMessages: Record<discord.ChannelType, string> = {
    [discord.ChannelType.GuildVoice]: 'Channel cannot be a voice channel',
    [discord.ChannelType.GuildStageVoice]: 'Channel cannot be a stage channel',
    [discord.ChannelType.GuildCategory]: 'Channel cannot be a category',
    [discord.ChannelType.GuildDirectory]: 'Channel cannot be a directory channel',
    [discord.ChannelType.GuildForum]: 'Channel cannot be a forum channel',
    [discord.ChannelType.PrivateThread]: 'Channel cannot be a thread channel',
    [discord.ChannelType.PublicThread]: 'Channel cannot be a thread channel',
    [discord.ChannelType.AnnouncementThread]: 'Channel cannot be a thread channel',
    [discord.ChannelType.GuildAnnouncement]: 'Channel cannot be a news channel',
    [discord.ChannelType.GuildText]: 'Channel cannot be a text channel',
    [discord.ChannelType.DM]: 'Channel cannot be a dm channel',
    [discord.ChannelType.GroupDM]: 'Channel cannot be a group dm channel'
};

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channelType: discord.ChannelType, channelId: string) {
        super(errorMessages[channelType], `The channel ${channelId} is not a valid type`);
    }
}
