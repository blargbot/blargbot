import { Channel, Constants, PrivateChannel } from 'eris';

type ChannelType = typeof Constants[`ChannelTypes`];
const isPrivateMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Constants.ChannelTypes.DM]: true,
    [Constants.ChannelTypes.GROUP_DM]: true,
    [Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Constants.ChannelTypes.GUILD_NEWS]: false,
    [Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Constants.ChannelTypes.GUILD_STORE]: false,
    [Constants.ChannelTypes.GUILD_TEXT]: false,
    [Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isPrivateChannel<T extends Channel>(channel: T): channel is PrivateChannel & T {
    return isPrivateMap[channel.type];
}
