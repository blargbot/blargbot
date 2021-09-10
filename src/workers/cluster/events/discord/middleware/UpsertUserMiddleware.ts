import { IMiddleware, UserTable } from '@core/types';
import { Message } from 'discord.js';

export class UpsertUserMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly database: UserTable) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        const process = this.database.upsert(context.author);
        const result = await next();
        await process;
        return result;
    }
}
