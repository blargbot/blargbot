import { IMiddleware, UserTable } from '@core/types';
import { Message } from 'discord.js';

export class UpsertUserMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly database: UserTable) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        const [, result] = await Promise.all([
            this.database.upsert(context.author),
            next()
        ]);
        return result;
    }
}
