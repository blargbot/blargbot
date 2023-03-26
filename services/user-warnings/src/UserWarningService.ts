import type { ModLogMessageBroker } from '@blargbot/mod-log-client';
import type { UserWarningsUpdateRequestBody } from '@blargbot/user-warnings-client';

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

    public async addWarnings(guildId: bigint, userId: bigint, options: UserWarningsUpdateRequestBody): Promise<{ oldCount: number; newCount: number; }> {
        const result = await this.#database.add(guildId, userId, options.assign);
        if (result.newCount !== result.oldCount) {
            const type = options.assign > 0 ? 'Warning' : 'Pardon';
            await this.#modLog.createModlog({
                guildId,
                type,
                users: [userId],
                moderatorId: options.moderator,
                reason: options.reason,
                metadata: {
                    colour: modlogColour[type],
                    [type.toLowerCase()]: { count: Math.abs(options.assign), total: result.newCount }
                }
            });
        }
        return result;
    }

    public async clearWarnings(guildId: bigint, userId?: bigint): Promise<void> {
        await this.#database.clear(guildId, userId);
    }
}

const modlogColour = {
    ['Warning']: 0xd1be79,
    ['Pardon']: 0x79d196
};
