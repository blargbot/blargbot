export interface IGuildEventLogDatabase {
    get(guildId: bigint, event: string): Awaitable<bigint | null>;
    list(guildId: bigint): Awaitable<Record<string, bigint>>;
    set(guildId: bigint, event: string, channelId: bigint): Awaitable<void>;
    clear(guildId: bigint): Awaitable<string[]>;
    clear(guildId: bigint, event: string): Awaitable<void>;
}
