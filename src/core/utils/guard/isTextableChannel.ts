import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isTextableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: true,
    [eris.Constants.ChannelTypes.GROUP_DM]: true,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: true,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: true,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isTextableChannel<T extends eris.KnownChannel>(channel: T): channel is T & eris.KnownGuildTextableChannel {
    return isTextableMap[channel.type] && 'messages' in channel;
}
