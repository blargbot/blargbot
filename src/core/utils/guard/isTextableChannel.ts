import { Constants, KnownChannel, KnownGuildTextableChannel } from 'eris';

export function isTextableChannel<T extends KnownChannel>(channel: T): channel is T & KnownGuildTextableChannel {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return true;
        case Constants.ChannelTypes.GROUP_DM: return true;
        case Constants.ChannelTypes.GUILD_CATEGORY: return false;
        case Constants.ChannelTypes.GUILD_NEWS: return true;
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return true;
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return true;
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return true;
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return false;
        case Constants.ChannelTypes.GUILD_STORE: return false;
        case Constants.ChannelTypes.GUILD_TEXT: return true;
        case Constants.ChannelTypes.GUILD_VOICE: return false;
    }
}
