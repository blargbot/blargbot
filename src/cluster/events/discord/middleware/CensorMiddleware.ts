import type { CensorManager } from '@blargbot/cluster/managers/moderation/index.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as eris from 'eris';

export class CensorMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #censors: CensorManager;

    public constructor(censors: CensorManager) {
        this.#censors = censors;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.#censors.censor(context))
            return true;

        return await next();
    }
}
