import { RolemeManager } from '@cluster/managers';
import { IMiddleware, NextMiddleware } from '@core/types';
import { KnownMessage } from 'eris';

export class RolemesMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly rolemes: RolemeManager) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        const process = this.rolemes.execute(context);
        const result = await next();
        await process;
        return result;
    }
}
