import Eris from 'eris';

type ChannelType = typeof Eris.Constants['ChannelTypes'];
const isVoiceMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [Eris.Constants.ChannelTypes.DM]: false,
    [Eris.Constants.ChannelTypes.GROUP_DM]: false,
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: true,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isVoiceChannel<T extends Eris.KnownChannel>(channel: T): channel is T & Eris.KnownVoiceChannel {
    return isVoiceMap[channel.type];
}
