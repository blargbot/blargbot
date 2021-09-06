import { RolemeManager } from '@cluster/managers';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class RolemesMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly rolemes: RolemeManager) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        const [, result] = await Promise.all([
            this.rolemes.execute(context),
            next()
        ]);
        return result;
    }
}
