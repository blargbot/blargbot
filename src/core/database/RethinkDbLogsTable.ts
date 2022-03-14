import { Logger } from '@blargbot/core/Logger';
import { ChatlogIndex, ChatlogIndexTable } from '@blargbot/core/types';

import { RethinkDb, RethinkDbTable } from './base';

export class RethinkDbLogsTable extends RethinkDbTable<ChatlogIndex> implements ChatlogIndexTable {
    public constructor(
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super('logs', rethinkDb, logger);
    }

    public async add(index: ChatlogIndex): Promise<boolean> {
        return await this.rinsert(index);
    }

    public async get(id: string): Promise<ChatlogIndex | undefined> {
        return await this.rget(id);
    }
}
