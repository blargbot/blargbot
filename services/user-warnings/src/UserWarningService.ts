import type { ModLogMessageBroker } from '@blargbot/mod-log-client';

import type { IUserWarningDatabase } from './IUserWarningDatabase.js';

export class UserWarningService {
    readonly #database: IUserWarningDatabase;
    readonly #modLog: ModLogMessageBroker;

    public constructor(modLog: ModLogMessageBroker, database: IUserWarningDatabase) {
        this.#database = database;
        this.#modLog = modLog;
    }

    public async getWarnings(guildId: bigint, userId: bigint): Promise<number> {
        return await this.#database.get(guildId, userId);
    }

    public async addWarnings(guildId: bigint, userId: bigint, count: number): Promise<{ oldCount: number; newCount: number; }> {
        const result = await this.#database.add(guildId, userId, count);
        await this.#modLog.createModlog({
            guildId,
            type: count > 0 ? 'Warning' : 'Pardon',
            userId

        });
        return result;
    }

    public async clearWarnings(guildId: bigint, userId?: bigint): Promise<void> {
        await this.#database.clear(guildId, userId);
    }
}
