import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isThreadableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: false,
    [eris.Constants.ChannelTypes.GROUP_DM]: false,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: true,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: true,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadableChannel<T extends eris.KnownChannel>(channel: T): channel is T & eris.KnownThreadableChannel {
    return isThreadableMap[channel.type];
}
