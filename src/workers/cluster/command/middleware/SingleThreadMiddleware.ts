import { CommandMiddleware } from '@cluster/types';

import { CommandContext } from '../CommandContext';

export class SingleThreadMiddleware<TContext extends CommandContext> implements CommandMiddleware<TContext> {
    private readonly locks: Record<string, { warned: boolean; } | undefined>;
    public constructor(
        protected readonly keySelector: (context: TContext) => string
    ) {
        this.locks = {};
    }

    public async execute(context: TContext, next: () => Promise<void>): Promise<void> {
        const key = this.keySelector(context);
        const lock = this.locks[key];
        if (lock !== undefined) {
            if (!lock.warned) {
                lock.warned = true;
                await context.reply('❌ Sorry, this command is already running! Please wait and try again.');
            }
            return;
        }
        this.locks[key] = { warned: false };
        try {
            await next();
        } finally {
            delete this.locks[key];
        }
    }
}
