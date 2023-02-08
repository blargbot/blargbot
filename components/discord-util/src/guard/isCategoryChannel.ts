type CategoryType = 4;
const categoryTypes = new Set(Object.keys<`${CategoryType}`>({
    [4]: null
}).map(v => Number(v) as CategoryType));

export function isCategoryChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: CategoryType; }> {
    return categoryTypes.has(channel.type);
}
