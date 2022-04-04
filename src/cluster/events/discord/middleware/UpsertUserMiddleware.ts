import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { UserStore } from '@blargbot/domain/stores';
import { KnownMessage } from 'eris';

export class UpsertUserMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly database: UserStore) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.database.upsert(context.author);
        const result = await next();
        await process;
        return result;
    }
}
