import { CommandResult } from '@blargbot/cluster/types';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import moment from 'moment-timezone';

import templates from '../../text';
import { CommandContext } from '../CommandContext';

interface RollingRatelimitMiddlewareOptions {
    readonly period: moment.Duration;
    readonly maxCommands: number;
    readonly cooldown: moment.Duration;
    readonly penalty: moment.Duration;
    readonly key: (context: CommandContext) => string;
}

export class RollingRatelimitMiddleware implements IMiddleware<CommandContext, CommandResult> {
    readonly #timeouts: Record<string, moment.Moment | undefined>;
    readonly #timestamps: Record<string, moment.Moment[] | undefined>;
    readonly #options: RollingRatelimitMiddlewareOptions;

    public constructor(options: RollingRatelimitMiddlewareOptions) {
        this.#timeouts = {};
        this.#timestamps = {};
        this.#options = options;
    }

    public async execute(context: CommandContext, next: NextMiddleware<CommandResult>): Promise<CommandResult> {
        const key = this.#options.key(context);

        let timeout = this.#timeouts[key];
        if (timeout !== undefined) {
            if (timeout.isAfter(moment())) {
                timeout.add(this.#options.penalty);
                return;
            }
            delete this.#timeouts[key];
        }

        const cutoff = moment().add(-this.#options.period);
        const messages = this.#timestamps[key] = this.#timestamps[key]?.filter(t => cutoff.isBefore(t)) ?? [];
        if (messages.push(moment()) < this.#options.maxCommands)
            return await next();

        timeout = this.#timeouts[key] = moment().add(this.#options.cooldown);
        return templates.commands.$errors.rateLimited.global({ duration: this.#options.cooldown, penalty: this.#options.penalty });
    }
}
