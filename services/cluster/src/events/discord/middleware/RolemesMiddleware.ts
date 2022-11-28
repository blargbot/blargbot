import { RolemeManager } from '@blargbot/cluster/managers';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class RolemesMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #rolemes: RolemeManager;

    public constructor(rolemes: RolemeManager) {
        this.#rolemes = rolemes;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.#rolemes.execute(context);
        const result = await next();
        await process;
        return result;
    }
}
