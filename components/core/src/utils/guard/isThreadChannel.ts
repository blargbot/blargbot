import * as Eris from 'eris';

type ThreadType = Eris.KnownThreadChannel['type'];
const threadTypes = new Set(Object.keys<`${ThreadType}`>({
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: null
}).map(v => Number(v) as ThreadType));

export function isThreadChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: ThreadType; }> {
    return threadTypes.has(channel.type);
}
