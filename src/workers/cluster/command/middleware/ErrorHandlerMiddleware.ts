import { CommandMiddleware } from '@cluster/types';

import { CommandContext } from '../CommandContext';

export class ErrorHandlerMiddleware<TContext extends CommandContext> implements CommandMiddleware<TContext> {
    public async execute(context: TContext, next: () => Promise<void>): Promise<void> {
        try {
            await next();
        } catch (err: unknown) {
            context.logger.error(err);
        }
    }
}
