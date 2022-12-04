import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type { UserStore } from '@blargbot/domain/stores/index.js';
import type * as Eris from 'eris';

export class UpsertUserMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #database: UserStore;

    public constructor(database: UserStore) {
        this.#database = database;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#database.upsert(context.author);
        const result = await next();
        await process;
        return result;
    }
}
