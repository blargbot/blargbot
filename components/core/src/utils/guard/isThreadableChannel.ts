import Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isThreadableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: false,
    [Eris.Constants.ChannelTypes.GROUP_DM]: false,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: true,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: true,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadableChannel<T extends Eris.KnownChannel>(channel: T): channel is T & Eris.KnownThreadableChannel {
    return isThreadableMap[channel.type];
}
