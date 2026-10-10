import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isCategoryType: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: false,
    [eris.Constants.ChannelTypes.GROUP_DM]: false,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: true,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isCategoryChannel<T extends eris.KnownChannel>(channel: T): channel is eris.KnownCategoryChannel & T {
    return isCategoryType[channel.type];
}
