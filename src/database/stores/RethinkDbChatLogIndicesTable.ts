import { ChatLogIndex } from '@blargbot/domain/models';
import { ChatLogIndicesTable } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';

import { RethinkDb } from '../clients';
import { RethinkDbTable } from '../tables/RethinkDbTable';

export class RethinkDbChatLogIndicesTable implements ChatLogIndicesTable {
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
