import { Constants, KnownChannel, KnownVoiceChannel } from 'eris';

type ChannelType = typeof Constants['ChannelTypes'];
const isVoiceMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: false,
    [Constants.ChannelTypes.GROUP_DM]: false,
    [Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Constants.ChannelTypes.GUILD_NEWS]: false,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: true,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: false,
    [Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isVoiceChannel<T extends KnownChannel>(channel: T): channel is T & KnownVoiceChannel {
    return isVoiceMap[channel.type];
}
