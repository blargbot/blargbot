import { Constants, KnownChannel, KnownVoiceChannel } from 'eris';

export function isVoiceChannel<T extends KnownChannel>(channel: T): channel is T & KnownVoiceChannel {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return false;
        case Constants.ChannelTypes.GROUP_DM: return false;
        case Constants.ChannelTypes.GUILD_CATEGORY: return false;
        case Constants.ChannelTypes.GUILD_NEWS: return false;
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return false;
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return true;
        case Constants.ChannelTypes.GUILD_STORE: return false;
        case Constants.ChannelTypes.GUILD_TEXT: return false;
        case Constants.ChannelTypes.GUILD_VOICE: return true;
    }
}
