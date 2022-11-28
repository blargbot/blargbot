import { Constants, KnownChannel, KnownThreadableChannel } from 'eris';

type ChannelType = typeof Constants['ChannelTypes'];
const isThreadableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: false,
    [Constants.ChannelTypes.GROUP_DM]: false,
    [Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Constants.ChannelTypes.GUILD_NEWS]: true,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: true,
    [Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadableChannel<T extends KnownChannel>(channel: T): channel is T & KnownThreadableChannel {
    return isThreadableMap[channel.type];
}
