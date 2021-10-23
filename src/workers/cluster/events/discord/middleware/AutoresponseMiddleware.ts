import { AutoresponseManager } from '@cluster/managers';
import { IMiddleware, NextMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class AutoresponseMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly manager: AutoresponseManager) {
    }

    public async execute(context: Message, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.manager.execute(context, true);
        const handled = await next();
        if (!handled)
            await this.manager.execute(context, false);

        await process;
        return handled;
    }

}
