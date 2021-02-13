import { AnyGuildChannel, Constants, GuildTextableChannel } from 'eris';


export function isGuildTextableChannel<T extends AnyGuildChannel>(channel: T): channel is GuildTextableChannel & T {
    return channel.type === Constants.ChannelTypes.GUILD_TEXT
        || channel.type === Constants.ChannelTypes.GUILD_NEWS;
}
