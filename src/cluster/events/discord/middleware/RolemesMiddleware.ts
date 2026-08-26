import type { RolemeManager } from '@blargbot/cluster/managers/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as eris from 'eris';

export class RolemesMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #rolemes: RolemeManager;

    public constructor(rolemes: RolemeManager) {
        this.#rolemes = rolemes;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#rolemes.execute(context);
        const result = await next();
        await process;
        return result;
    }
}
