import type { DiscordModLogEntry } from './DiscordModLogEntry.js';

export interface IDiscordModLogEntryDatabase {
    get(guildId: bigint, caseId: number): Awaitable<DiscordModLogEntry | undefined>;
    set(entry: DiscordModLogEntry): Awaitable<void>;
    delete(guildId: bigint, caseId: number): Awaitable<void>;
}
