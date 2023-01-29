import * as Eris from 'eris';

type ThreadableType = Eris.KnownThreadableChannel['type'];
const threadableTypes = new Set(Object.keys<`${ThreadableType}`>({
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: null,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: null
}).map(v => Number(v) as ThreadableType));

export function isThreadableChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: ThreadableType; }> {
    return threadableTypes.has(channel.type);
}
