export interface IUserWarningDatabase {
    get(guildId: bigint, userId: bigint): Awaitable<number>;
    add(guildId: bigint, userId: bigint, count: number): Awaitable<{ oldCount: number; newCount: number; }>;
    clear(guildId: bigint, userId?: bigint): Awaitable<void>;
}
