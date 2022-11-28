import Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isTextableMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: true,
    [Eris.Constants.ChannelTypes.GROUP_DM]: true,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: true,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: true,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: false,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: true,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isTextableChannel<T extends Eris.KnownChannel>(channel: T): channel is T & Eris.KnownGuildTextableChannel {
    return isTextableMap[channel.type] && 'messages' in channel;
}
