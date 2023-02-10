import type { ModLogEntry } from './ModLogEntry.js';

export interface IModLogEntryDatabase {
    get(guildId: bigint, caseId: number): Awaitable<ModLogEntry | undefined>;
    list(guildId: bigint): Awaitable<ModLogEntry[]>;
    create(guildId: bigint, value: Omit<ModLogEntry, 'caseId'>): Awaitable<number>;
    update(guildId: bigint, caseId: number, value: Partial<Omit<ModLogEntry, 'caseId'>>): Awaitable<void>;
    delete(guildId: bigint, caseId: number): Awaitable<void>;
}
