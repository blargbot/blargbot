import type { ModLogCreateRequest, ModLogDeleteRequest, ModLogMessageBroker, ModLogUpdateRequest } from '@blargbot/mod-log-client';

import type { IModLogEntryDatabase } from './IModLogEntryDatabase.js';

export class ModLogService {
    readonly #database: IModLogEntryDatabase;
    readonly #messages: ModLogMessageBroker;

    public constructor(database: IModLogEntryDatabase, messages: ModLogMessageBroker) {
        this.#database = database;
        this.#messages = messages;
    }

    public async createModLog(options: ModLogCreateRequest): Promise<void> {
        const modLog = await this.#database.create(options);
        await this.#messages.modLogCreated({
            ...modLog,
            moderatorId: modLog.moderatorId ?? undefined,
            reason: modLog.reason ?? undefined
        });
    }

    public async updateModLog(options: ModLogUpdateRequest): Promise<void> {
        const modLog = await this.#database.update(options);
        if (modLog === undefined)
            return;
        await this.#messages.modLogUpdated({
            ...modLog,
            moderatorId: modLog.moderatorId ?? undefined,
            reason: modLog.reason ?? undefined
        });
    }

    public async deleteModLog(options: ModLogDeleteRequest): Promise<void> {
        const modLog = await this.#database.delete(options);
        if (modLog === undefined)
            return;
        await this.#messages.modLogDeleted({
            ...modLog,
            moderatorId: modLog.moderatorId ?? undefined,
            reason: modLog.reason ?? undefined
        });
    }
}
