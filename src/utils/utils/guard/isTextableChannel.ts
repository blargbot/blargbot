import { AnyChannel, Constants, TextableChannel } from 'eris';


export function isTextableChannel<T extends AnyChannel>(channel: T): channel is TextableChannel & T {
    switch (channel.type) {
        case Constants.ChannelTypes.DM:
        case Constants.ChannelTypes.GROUP_DM:
        case Constants.ChannelTypes.GUILD_NEWS:
        case Constants.ChannelTypes.GUILD_TEXT:
            return true;
        default:
            return false;
    }
}
