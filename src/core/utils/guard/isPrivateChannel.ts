import { Channel, Constants, PrivateChannel } from 'eris';

export function isPrivateChannel<T extends Channel>(channel: T): channel is PrivateChannel & T {
    switch (channel.type) {
        case Constants.ChannelTypes.DM: return true;
        case Constants.ChannelTypes.GROUP_DM: return true;
        case Constants.ChannelTypes.GUILD_CATEGORY: return false;
        case Constants.ChannelTypes.GUILD_NEWS: return false;
        case Constants.ChannelTypes.GUILD_NEWS_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PRIVATE_THREAD: return false;
        case Constants.ChannelTypes.GUILD_PUBLIC_THREAD: return false;
        case Constants.ChannelTypes.GUILD_STAGE_VOICE: return false;
        case Constants.ChannelTypes.GUILD_STORE: return false;
        case Constants.ChannelTypes.GUILD_TEXT: return false;
        case Constants.ChannelTypes.GUILD_VOICE: return false;
        default: return false;
    }
}
