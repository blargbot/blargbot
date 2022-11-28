import { Logger } from '@blargbot/logger';
import { CronJob, CronJobParameters } from 'cron';

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
            onTick: this.makeSafeCaller(() => this.execute(), this.logger, 'CronJob')
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
