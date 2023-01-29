import * as Eris from 'eris';

type PrivateType = Eris.PrivateChannel['type'];
const privateTypes = new Set(Object.keys<`${PrivateType}`>({
    [Eris.Constants.ChannelTypes.DM]: null,
    [Eris.Constants.ChannelTypes.GROUP_DM]: null
}).map(v => Number(v) as PrivateType));

export function isPrivateChannel<T extends { type: number; }>(channel: T): channel is Extract<T, { type: PrivateType; }> {
    return privateTypes.has(channel.type);
}
