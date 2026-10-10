import * as eris from 'eris';

type ChannelType = typeof eris.Constants['ChannelTypes'];
const isVoiceMap: Record<ChannelType[keyof ChannelType], boolean> = {
    [eris.Constants.ChannelTypes.DM]: false,
    [eris.Constants.ChannelTypes.GROUP_DM]: false,
    [eris.Constants.ChannelTypes.GUILD_CATEGORY]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS]: false,
    [eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: false,
    [eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: true,
    [eris.Constants.ChannelTypes.GUILD_STORE]: false,
    [eris.Constants.ChannelTypes.GUILD_TEXT]: false,
    [eris.Constants.ChannelTypes.GUILD_VOICE]: true
};

export function isVoiceChannel<T extends eris.KnownChannel>(channel: T): channel is T & eris.KnownVoiceChannel {
    return isVoiceMap[channel.type];
}
