import { Channel, Constants, KnownThreadChannel } from 'eris';

type ChannelType = typeof Constants['ChannelTypes'];
const isThreadMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: false,
    [Constants.ChannelTypes.GROUP_DM]: false,
    [Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Constants.ChannelTypes.GUILD_NEWS]: false,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: false,
    [Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadChannel<T extends Channel>(channel: T): channel is KnownThreadChannel & T {
    return isThreadMap[channel.type];
}
