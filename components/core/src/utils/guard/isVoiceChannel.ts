import * as Eris from 'eris';

type VoiceType = Eris.VoiceChannel['type'];
const voiceTypes = new Set(Object.keys<`${VoiceType}`>({
    [Eris.Constants.ChannelTypes.GUILD_STAGE_VOICE]: null,
    [Eris.Constants.ChannelTypes.GUILD_VOICE]: null

}).map(v => Number(v) as VoiceType));

export function isVoiceChannel<T extends { type: number; }>(channel: T): channel is T & { type: VoiceType; } {
    return voiceTypes.has(channel.type);
}
