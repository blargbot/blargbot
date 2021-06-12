import { inspect } from 'util';
import { BaseService } from './BaseService';

export abstract class IntervalService extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    #interval?: NodeJS.Timeout;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: () => Promise<void>;

    protected constructor(
        public readonly period: number,
        public readonly logger: CatLogger
    ) {
        super();

        this.#execute = async () => {
            try {
                await this.execute();
            } catch (err) {
                this.logger.error(`Interval ${this.name} threw an error: ${inspect(err)}`);
            }
        };
    }

    protected abstract execute(): Promise<void> | void;

    public start(): void {
        if (this.#interval !== undefined)
            throw new Error(`Interval ${this.name} is already running`);

        this.#interval = setInterval(() => void this.#execute(), this.period);
    }

    public stop(): void {
        if (this.#interval === undefined)
            throw new Error(`Interval ${this.name} is not running`);

        clearInterval(this.#interval);
        this.#interval = undefined;
    }
}