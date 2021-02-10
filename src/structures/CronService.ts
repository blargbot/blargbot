import { CronJob, CronJobParameters } from 'cron';
import { inspect } from 'util';
import { BaseService } from './BaseService';

export abstract class CronService extends BaseService {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    readonly #cronJob: CronJob;
    public readonly type: string = 'CronJob';

    protected constructor(
        options: Omit<CronJobParameters, 'onTick' | 'onComplete'>,
        public readonly logger: CatLogger
    ) {
        super();
        this.#cronJob = new CronJob({
            ...options,
            onTick: () => void this._execute()
        });
    }

    protected abstract execute(): unknown;

    public start(): void {
        this.#cronJob.start();
    }

    public stop(): void {
        this.#cronJob.stop();
    }

    private async _execute(): Promise<void> {
        try {
            await this.execute();
        } catch (err) {
            this.logger.error(`CronJob ${this.name} threw an error: ${inspect(err)}`);
            this.stop();
        }
    }
}
