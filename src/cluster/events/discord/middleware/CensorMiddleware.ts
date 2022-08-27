import { CensorManager } from '@blargbot/cluster/managers/moderation';
import { guard } from '@blargbot/cluster/utils';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class CensorMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #censors: CensorManager;

    public constructor(censors: CensorManager) {
        this.#censors = censors;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (!guard.isGuildMessage(context))
            return await next();

        if (await this.#censors.censor(context))
            return true;

        return await next();
    }
}
