type ThreadableType = 0 | 5;
const threadableTypes = new Set(Object.keys<`${ThreadableType}`>({
    [0]: null,
    [5]: null
}).map(v => Number(v) as ThreadableType));

export function isThreadableChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: ThreadableType; }> {
    return threadableTypes.has(channel.type);
}
