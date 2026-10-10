import type { Logger } from '@blargbot/logger';
import moment from 'moment-timezone';

import { BaseService } from './BaseService.js';

export abstract class IntervalService extends BaseService {
    #interval?: NodeJS.Timeout;
    readonly #execute: () => void;

    public readonly period: moment.Duration;
    public readonly logger: Logger;
    readonly #immediate: boolean;

    protected constructor(period: moment.DurationInputArg1, logger: Logger);
    protected constructor(period: moment.DurationInputArg1, logger: Logger, immediate: boolean);
    protected constructor(period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger);
    protected constructor(period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger, immediate: boolean);
    protected constructor(...args:
        | [period: moment.DurationInputArg1, logger: Logger]
        | [period: moment.DurationInputArg1, logger: Logger, immediate: boolean]
        | [period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger]
        | [period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger, immediate: boolean]) {
        super();

        const [period, unit, logger, immediate] = mapArgs(args);
        this.period = moment.duration(period, unit);
        this.logger = logger;
        this.#immediate = immediate ?? false;
        this.#execute = this.makeSafeCaller(this.execute.bind(this), this.logger, 'Interval');
    }

    public abstract execute(): Promise<void> | void;

    public start(): void {
        if (this.#interval !== undefined)
            throw new Error(`Interval ${this.name} is already running`);

        this.#interval = setInterval(this.#execute, this.period.asMilliseconds());
        if (this.#immediate)
            this.#execute();
    }

    public stop(): void {
        if (this.#interval === undefined)
            throw new Error(`Interval ${this.name} is not running`);

        clearInterval(this.#interval);
        this.#interval = undefined;
    }
}

function mapArgs(args:
    | [period: moment.DurationInputArg1, logger: Logger]
    | [period: moment.DurationInputArg1, logger: Logger, immediate: boolean]
    | [period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger]
    | [period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger, immediate: boolean]
): [duration: moment.DurationInputArg1, unit: moment.DurationInputArg2 | undefined, logger: Logger, immediate: boolean | undefined] {

    switch (args.length) {
        case 2:
            return [args[0], undefined, args[1], undefined];
        case 3:
            return check3Args(args)
                ? [args[0], undefined, args[1], args[2]]
                : [args[0], args[1], args[2], undefined];
        case 4:
            return args;
    }
}

function check3Args(args:
    | [period: moment.DurationInputArg1, logger: Logger, immediate: boolean]
    | [period: moment.DurationInputArg1, unit: moment.DurationInputArg2, logger: Logger]
): args is [duration: moment.DurationInputArg1, logger: Logger, immediate: boolean] {
    return typeof args[2] === 'boolean';
}
