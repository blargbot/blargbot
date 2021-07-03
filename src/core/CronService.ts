import { CronJob, CronJobParameters } from 'cron';
import { inspect } from 'util';
import { BaseService } from './BaseService';
import { Logger } from './Logger';

export abstract class CronService extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cronJob: CronJob;
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #execute: () => Promise<void>;

    protected constructor(
        options: Omit<CronJobParameters, 'onTick' | 'onComplete'>,
        public readonly logger: Logger
    ) {
        super();
        this.#execute = async () => {
            try {
                await this.execute();
            } catch (err: unknown) {
                this.logger.error(`CronJob ${this.name} threw an error: ${inspect(err)}`);
            }
        };
        this.#cronJob = new CronJob({
            ...options,
            onTick: () => void this.#execute()
        });
    }

    protected abstract execute(): unknown;

    public start(): void {
        this.#cronJob.start();
    }

    public stop(): void {
        this.#cronJob.stop();
    }
}
