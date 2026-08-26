import type { AutoresponseManager } from '@blargbot/cluster/managers/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as eris from 'eris';

export class AutoresponseMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #manager: AutoresponseManager;

    public constructor(manager: AutoresponseManager) {
        this.#manager = manager;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#manager.execute(context, true);
        const handled = await next();
        if (!handled)
            await this.#manager.execute(context, false);

        await process;
        return handled;
    }

}
