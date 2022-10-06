import { Constants, KnownChannel, KnownGuildTextableChannel } from 'eris';

type ChannelType = typeof Constants[`ChannelTypes`];
const isTextableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: true,
    [Constants.ChannelTypes.GROUP_DM]: true,
    [Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Constants.ChannelTypes.GUILD_NEWS]: true,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: true,
    [Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isTextableChannel<T extends KnownChannel>(channel: T): channel is T & KnownGuildTextableChannel {
    return isTextableMap[channel.type] && `messages` in channel;
}
