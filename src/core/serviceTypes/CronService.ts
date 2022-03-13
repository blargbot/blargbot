import { Logger } from '@core/Logger';
import { CronJob, CronJobParameters } from 'cron';
import { inspect } from 'util';

import { BaseService } from './BaseService';

export abstract class CronService extends BaseService {
    readonly #cronJob: CronJob;

    protected constructor(
        options: Omit<CronJobParameters, 'onTick' | 'onComplete'>,
        public readonly logger: Logger
    ) {
        super();
        this.#cronJob = new CronJob({
            ...options,
            onTick: async () => {
                try {
                    this.logger.debug(`Executing CronJob ${this.name}`);
                    await this.execute();
                } catch (err: unknown) {
                    this.logger.error(`CronJob ${this.name} threw an error: ${inspect(err)}`);
                }
            }
        });
    }

    public abstract execute(): unknown;

    public start(): void {
        this.#cronJob.start();
    }

    public stop(): void {
        this.#cronJob.stop();
    }
}
