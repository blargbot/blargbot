import { CategoryChannel, Channel, Constants } from 'eris';

export function isCategoryChannel<T extends Channel>(channel: T): channel is CategoryChannel & T {
    switch (channel.type) {
        case Constants.ChannelTypes.GUILD_CATEGORY:
            return true;
        default:
            return false;
    }
}
