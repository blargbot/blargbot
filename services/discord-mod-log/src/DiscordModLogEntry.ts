export interface DiscordModLogEntry {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly channelId: bigint;
    readonly messageId: bigint;
}
