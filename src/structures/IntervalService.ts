import { inspect } from 'util';
import { BaseService } from './BaseService';

export abstract class IntervalService extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #interval?: NodeJS.Timeout;
    public readonly type: string = 'Interval';

    protected constructor(
        public readonly period: number,
        public readonly logger: CatLogger
    ) {
        super();
    }

    protected abstract execute(): Promise<void> | void;

    public start(): void {
        if (this.#interval !== undefined)
            throw new Error(`Interval ${this.name} is already running`);

        this.#interval = setInterval(() => void this._execute(), this.period);
    }

    public stop(): void {
        if (this.#interval === undefined)
            throw new Error(`Interval ${this.name} is not running`);

        clearInterval(this.#interval);
        this.#interval = undefined;
    }

    private async _execute(): Promise<void> {
        try {
            await this.execute();
        } catch (err) {
            this.logger.error(`Interval ${this.name} threw an error: ${inspect(err)}`);
            this.stop();
        }
    }
}