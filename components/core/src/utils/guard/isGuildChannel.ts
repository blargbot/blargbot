import * as Eris from 'eris';

type GuildType = Eris.GuildChannel['type'];
const guildTypes = new Set(Object.keys<`${GuildType}`>({
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: null,
    [Eris.Constants.ChannelTypes.GUILD_NEWS]: null,
    [Eris.Constants.ChannelTypes.GUILD_NEWS_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PRIVATE_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_PUBLIC_THREAD]: null,
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: null,
    [Eris.Constants.ChannelTypes.GUILD_STORE]: null,
    [Eris.Constants.ChannelTypes.GUILD_TEXT]: null,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: null,
    [Eris.Constants.ChannelTypes.GUILD_STAGE]: null
}).map(v => Number(v) as GuildType));

export function isGuildChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: GuildType; }> {
    return guildTypes.has(channel.type);
}
