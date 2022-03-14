import { AutoresponseManager } from '@cluster/managers';
import { IMiddleware, NextMiddleware } from '@core/types';
import { KnownMessage } from 'eris';

export class AutoresponseMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly manager: AutoresponseManager) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.manager.execute(context, true);
        const handled = await next();
        if (!handled)
            await this.manager.execute(context, false);

        await process;
        return handled;
    }

}
