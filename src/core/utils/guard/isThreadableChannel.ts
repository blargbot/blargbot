import { Constants, KnownChannel, KnownThreadableChannel } from 'eris';

export function isThreadableChannel<T extends KnownChannel>(channel: T): channel is T & KnownThreadableChannel {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return false;
        case Constants.ChannelTypes.GROUP_DM: return false;
        case Constants.ChannelTypes.GUILD_CATEGORY: return false;
        case Constants.ChannelTypes.GUILD_NEWS: return true;
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return false;
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return false;
        case Constants.ChannelTypes.GUILD_STORE: return false;
        case Constants.ChannelTypes.GUILD_TEXT: return true;
        case Constants.ChannelTypes.GUILD_VOICE: return false;
    }
}
