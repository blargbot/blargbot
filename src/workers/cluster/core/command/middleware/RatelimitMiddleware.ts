import moment, { Duration, Moment } from 'moment-timezone';
import { CommandMiddleware } from '../../types';
import { CommandContext } from '../CommandContext';

export class RatelimitMiddleware<TContext extends CommandContext> implements CommandMiddleware<TContext> {
    private readonly cooldowns: Record<string, { timestamp: Moment; warned: boolean; } | undefined>;
    public constructor(
        protected readonly cooldown: Duration,
        protected readonly keySelector: (context: TContext) => string
    ) {
        this.cooldowns = {};
    }

    public async execute(context: TContext, next: () => Promise<void>): Promise<void> {
        const key = this.keySelector(context);
        const lastUsage = this.cooldowns[key] ??= { timestamp: moment(), warned: false };
        if (moment().isBefore(lastUsage.timestamp)) {
            if (!lastUsage.warned) {
                const duration = moment.duration(lastUsage.timestamp.diff(moment()));
                lastUsage.warned = true;
                await context.reply(`❌ Sorry, you ran this command too recently! Please try again in ${Math.ceil(duration.asSeconds())} seconds.`);
            }
            return;
        }
        lastUsage.timestamp = moment().add(99, 'years');
        try {
            await next();
        } finally {
            lastUsage.timestamp = moment().add(this.cooldown);
            setTimeout(() => delete this.cooldowns[key], this.cooldown.asMilliseconds());
        }

    }
}
