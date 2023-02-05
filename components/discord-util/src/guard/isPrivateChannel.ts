type PrivateType = 1 | 3;
const privateTypes = new Set(Object.keys<`${PrivateType}`>({
    [1]: null,
    [3]: null
}).map(v => Number(v) as PrivateType));

export function isPrivateChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: PrivateType; }> {
    return privateTypes.has(channel.type);
}
