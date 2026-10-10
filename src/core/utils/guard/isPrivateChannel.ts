import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isPrivateMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: true,
    [eris.Constants.ChannelTypes.GROUP_DM]: true,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isPrivateChannel<T extends eris.Channel>(channel: T): channel is eris.PrivateChannel & T {
    return isPrivateMap[channel.type];
}
