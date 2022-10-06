import { ChannelType } from 'discord-api-types/v9';

import { BBTagRuntimeError } from './BBTagRuntimeError';

const errorMessages: Record<ChannelType, string> = {
    [ChannelType.GuildVoice]: `Channel cannot be a voice channel`,
    [ChannelType.GuildStageVoice]: `Channel cannot be a stage channel`,
    [ChannelType.GuildCategory]: `Channel cannot be a category`,
    [ChannelType.GuildDirectory]: `Channel cannot be a directory channel`,
    [ChannelType.GuildForum]: `Channel cannot be a forum channel`,
    [ChannelType.PrivateThread]: `Channel cannot be a thread channel`,
    [ChannelType.PublicThread]: `Channel cannot be a thread channel`,
    [ChannelType.AnnouncementThread]: `Channel cannot be a thread channel`,
    [ChannelType.GuildAnnouncement]: `Channel cannot be a news channel`,
    [ChannelType.GuildText]: `Channel cannot be a text channel`,
    [ChannelType.DM]: `Channel cannot be a dm channel`,
    [ChannelType.GroupDM]: `Channel cannot be a group dm channel`
};

export class InvalidChannelError extends BBTagRuntimeError {
    public constructor(public readonly channelType: ChannelType, channelId: string) {
        super(errorMessages[channelType], `The channel ${channelId} is not a valid type`);
    }
}
