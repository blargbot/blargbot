type TextableType = 0 | 1 | 2 | 3 | 5 | 10 | 11 | 12 | 13;
const textableTypes = new Set(Object.keys<`${TextableType}`>({
    [0]: null,
    [1]: null,
    [2]: null,
    [3]: null,
    [5]: null,
    [10]: null,
    [11]: null,
    [12]: null,
    [13]: null
}).map(v => Number(v) as TextableType));

export function isTextableChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: TextableType; }> {
    return textableTypes.has(channel.type);
}
