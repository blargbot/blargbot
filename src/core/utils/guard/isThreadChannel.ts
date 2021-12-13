import { Channel, Constants, KnownThreadChannel } from 'eris';

export function isThreadChannel<T extends Channel>(channel: T): channel is KnownThreadChannel & T {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return false;
        case Constants.ChannelTypes.GROUP_DM: return false;
        case Constants.ChannelTypes.GUILD_CATEGORY: return false;
        case Constants.ChannelTypes.GUILD_NEWS: return false;
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return true;
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return true;
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return true;
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return false;
        case Constants.ChannelTypes.GUILD_STORE: return false;
        case Constants.ChannelTypes.GUILD_TEXT: return false;
        case Constants.ChannelTypes.GUILD_VOICE: return false;
    }
}
