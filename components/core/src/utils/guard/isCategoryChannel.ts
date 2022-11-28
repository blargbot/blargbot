import { Constants, KnownCategoryChannel, KnownChannel } from 'eris';

type ChannelType = typeof Constants['ChannelTypes'];
const isCategoryType: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: false,
    [Constants.ChannelTypes.GROUP_DM]: false,
    [Constants.ChannelTypes.GUILD_CATEGORY]: true,
    [Constants.ChannelTypes.GUILD_NEWS]: false,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: false,
    [Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isCategoryChannel<T extends KnownChannel>(channel: T): channel is KnownCategoryChannel & T {
    return isCategoryType[channel.type];
}
