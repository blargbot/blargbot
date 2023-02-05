type ThreadType = 10 | 11 | 12;
const threadTypes = new Set(Object.keys<`${ThreadType}`>({
    [10]: null,
    [11]: null,
    [12]: null
}).map(v => Number(v) as ThreadType));

export function isThreadChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: ThreadType; }> {
    return threadTypes.has(channel.type);
}
