import type { Logger } from '@blargbot/logger';
import cron from 'cron';

import { BaseService } from './BaseService.js';

export abstract class CronService extends BaseService {
    readonly #cronJob: cron.CronJob;

    protected constructor(
        options: Omit<cron.CronJobParameters, 'onTick' | 'onComplete'>,
        public readonly logger: Logger
    ) {
        super();
        this.#cronJob = new cron.CronJob({
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
