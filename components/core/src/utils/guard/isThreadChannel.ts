import * as Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isThreadMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: false,
    [Eris.Constants.ChannelTypes.GROUP_DM]: false,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: false
};

export function isThreadChannel<T extends Eris.Channel>(channel: T): channel is Eris.KnownThreadChannel & T {
    return isThreadMap[channel.type];
}
