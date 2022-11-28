import { CensorManager } from '@blargbot/cluster/managers/moderation';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import Eris from 'eris';

export class CensorMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #censors: CensorManager;

    public constructor(censors: CensorManager) {
        this.#censors = censors;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.#censors.censor(context))
            return true;

        return await next();
    }
}
