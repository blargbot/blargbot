export interface ModLogEntry {
    readonly caseId: number;
    readonly guildId: bigint;
    readonly users: readonly bigint[];
    readonly timestamp: Date;
    readonly moderatorId: bigint | null;
    readonly reason: string | null;
    readonly type: string;
    readonly metadata: Record<string, JToken>;
}
