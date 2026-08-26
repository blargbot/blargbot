import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type { UserStore } from '@blargbot/domain/stores/index.js';
import type * as eris from 'eris';

export class UpsertUserMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #database: UserStore;

    public constructor(database: UserStore) {
        this.#database = database;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#database.upsert(context.author);
        const result = await next();
        await process;
        return result;
    }
}
