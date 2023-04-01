import type { MessageDump } from '@blargbot/message-dumps-client';

import type MessageDumpDatabase from './MessageDumpDatabase.js';

export class MessageDumpService {
    readonly #database: MessageDumpDatabase;

    public constructor(database: MessageDumpDatabase) {
        this.#database = database;
    }

    public async addMessageDump(message: MessageDump): Promise<void> {
        await this.#database.add(message);
    }

    public async getMessageDump(id: bigint): Promise<MessageDump | undefined> {
        return await this.#database.get(id);
    }
}
