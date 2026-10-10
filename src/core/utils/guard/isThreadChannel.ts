import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isThreadMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: false,
    [eris.Constants.ChannelTypes.GROUP_DM]: false,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadChannel<T extends eris.Channel>(channel: T): channel is eris.KnownThreadChannel & T {
    return isThreadMap[channel.type];
}
