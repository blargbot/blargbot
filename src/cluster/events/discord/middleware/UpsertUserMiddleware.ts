import { IMiddleware, NextMiddleware, UserTable } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class UpsertUserMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly database: UserTable) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.database.upsert(context.author);
        const result = await next();
        await process;
        return result;
    }
}
