import * as Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isPrivateMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: true,
    [Eris.Constants.ChannelTypes.GROUP_DM]: true,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isPrivateChannel<T extends Eris.Channel>(channel: T): channel is Eris.PrivateChannel & T {
    return isPrivateMap[channel.type];
}
