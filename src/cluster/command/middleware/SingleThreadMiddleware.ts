import { CommandResult } from '@blargbot/cluster/types';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';

import templates from '../../text';
import { CommandContext } from '../CommandContext';

export class SingleThreadMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    readonly #locks: Record<string, { warned: boolean; } | undefined>;

    public constructor(
        protected readonly keySelector: (context: TContext) => string
    ) {
        this.#locks = {};
    }

    public async execute(context: TContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        const key = this.keySelector(context);
        const lock = this.#locks[key];
        if (lock !== undefined) {
            if (!lock.warned) {
                lock.warned = true;
                return templates.commands.$errors.alreadyRunning;
            }
            return;
        }
        this.#locks[key] = { warned: false };
        try {
            return await next();
        } finally {
            delete this.#locks[key];
        }
    }
}
