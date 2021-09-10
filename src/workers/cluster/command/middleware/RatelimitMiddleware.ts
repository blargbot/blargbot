import { CommandResult } from '@cluster/types';
import { IMiddleware } from '@core/types';
import moment, { Duration, Moment } from 'moment-timezone';

import { CommandContext } from '../CommandContext';

export class RatelimitMiddleware<TContext extends CommandContext> implements IMiddleware<TContext, CommandResult> {
    private readonly cooldowns: Record<string, { timestamp: Moment; warned: boolean; } | undefined>;
    public constructor(
        protected readonly cooldown: Duration,
        protected readonly keySelector: (context: TContext) => string
    ) {
        this.cooldowns = {};
    }

    public async execute(context: TContext, next: () => Awaitable<CommandResult>): Promise<CommandResult> {
        const key = this.keySelector(context);
        const lastUsage = this.cooldowns[key] ??= { timestamp: moment(), warned: false };
        if (moment().isAfter(lastUsage.timestamp)) {
            if (lastUsage.warned)
                return;

            const duration = moment.duration(lastUsage.timestamp.diff(moment()));
            lastUsage.warned = true;
            return `❌ Sorry, you ran this command too recently! Please try again in ${Math.ceil(duration.asSeconds())} seconds.`;
        }

        lastUsage.timestamp = moment().add(99, 'years');
        try {
            return await next();
        } finally {
            lastUsage.timestamp = moment().add(this.cooldown);
            setTimeout(() => delete this.cooldowns[key], this.cooldown.asMilliseconds());
        }
    }
}
