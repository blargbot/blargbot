import { AutoresponseManager } from '@cluster/managers';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class AutoresponseMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly manager: AutoresponseManager) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        const promises = [this.manager.execute(context, true)];
        const handled = await next();
        if (!handled)
            promises.push(this.manager.execute(context, false));

        await Promise.all(promises);
        return handled;
    }

}
