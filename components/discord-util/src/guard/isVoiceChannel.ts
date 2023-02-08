type VoiceType = 2 | 13;
const voiceTypes = new Set(Object.keys<`${VoiceType}`>({
    [2]: null,
    [13]: null

}).map(v => Number(v) as VoiceType));

export function isVoiceChannel<T extends { type: number; }>(channel: T): channel is T & { type: VoiceType; } {
    return voiceTypes.has(channel.type);
}
