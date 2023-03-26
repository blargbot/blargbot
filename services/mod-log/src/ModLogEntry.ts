export interface ModLogEntry {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly moderatorId: bigint | null;
    readonly reason: string | null;
    readonly type: string;
}
