import { AutoresponseManager } from '@blargbot/cluster/managers';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class AutoresponseMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #manager: AutoresponseManager;

    public constructor(manager: AutoresponseManager) {
        this.#manager = manager;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#manager.execute(context, true);
        const handled = await next();
        if (!handled)
            await this.#manager.execute(context, false);

        await process;
        return handled;
    }

}
