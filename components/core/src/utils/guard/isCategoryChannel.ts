import * as Eris from 'eris';

type CategoryType = Eris.CategoryChannel['type'];
const categoryTypes = new Set(Object.keys<`${CategoryType}`>({
    [Eris.Constants.ChannelTypes.GUILD_CATEGORY]: null
}).map(v => Number(v) as CategoryType));

export function isCategoryChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: CategoryType; }> {
    return categoryTypes.has(channel.type);
}
