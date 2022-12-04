import type { ChatLogIndex } from '@blargbot/domain/models/index.js';
import type { ChatLogIndexStore } from '@blargbot/domain/stores/index.js';
import type { Logger } from '@blargbot/logger';

import type { RethinkDb } from '../clients/index.js';
import { RethinkDbTable } from '../tables/RethinkDbTable.js';

export class RethinkDbChatLogIndexStore implements ChatLogIndexStore {
    readonly #table: RethinkDbTable<ChatLogIndex>;

    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        this.#table = new RethinkDbTable('logs', rethinkDb, logger);
    }

    public async add(index: ChatLogIndex): Promise<boolean> {
        return await this.#table.insert(index);
    }

    public async get(id: string): Promise<ChatLogIndex | undefined> {
        return await this.#table.get(id);
    }
}
