import * as Eris from 'eris';

type TextableType = Eris.KnownTextableChannel['type'];
const textableTypes = new Set(Object.keys<`${TextableType}`>({
    [Eris.Constants.ChannelTypes.DM]: null,
    [Eris.Constants.ChannelTypes.GROUP_DM]: null,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: null,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: null,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: null,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: null
}).map(v => Number(v) as TextableType));

export function isTextableChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: TextableType; }> {
    return textableTypes.has(channel.type);
}
