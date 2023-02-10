import type { IUserWarningDatabase } from './IUserWarningDatabase.js';

export class UserWarningService {
    readonly #database: IUserWarningDatabase;

    public constructor(database: IUserWarningDatabase) {
        this.#database = database;
    }

    public async getWarnings(guildId: bigint, userId: bigint): Promise<number> {
        return await this.#database.get(guildId, userId);
    }

    public async addWarnings(guildId: bigint, userId: bigint, count: number): Promise<{ oldCount: number; newCount: number; }> {
        return await this.#database.add(guildId, userId, count);
    }

    public async clearWarnings(guildId: bigint, userId?: bigint): Promise<void> {
        await this.#database.clear(guildId, userId);
    }
}
