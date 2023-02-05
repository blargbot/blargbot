type GuildType = 0 | 2 | 4 | 5 | 10 | 11 | 12 | 13 | 14 | 15;
const guildTypes = new Set(Object.keys<`${GuildType}`>({
    [0]: null,
    [2]: null,
    [4]: null,
    [5]: null,
    [10]: null,
    [11]: null,
    [12]: null,
    [13]: null,
    [14]: null,
    [15]: null
}).map(v => Number(v) as GuildType));

export function isGuildChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: GuildType; }> {
    return guildTypes.has(channel.type);
}
