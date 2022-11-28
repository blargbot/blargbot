import Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isCategoryType: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: false,
    [Eris.Constants.ChannelTypes.GROUP_DM]: false,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: true,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isCategoryChannel<T extends Eris.KnownChannel>(channel: T): channel is Eris.KnownCategoryChannel & T {
    return isCategoryType[channel.type];
}
