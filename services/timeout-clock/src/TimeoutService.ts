import type { TimeoutClockMessageBroker } from '@blargbot/timeout-clock-client';
import { CronJob } from 'cron';

export class TimeoutService {
    readonly #messages: TimeoutClockMessageBroker;
    readonly #cron: CronJob;

    public constructor(cron: string, messages: TimeoutClockMessageBroker) {
        this.#messages = messages;
        this.#cron = new CronJob(cron, this.#onCron.bind(this));
    }

    public start(): void {
        this.#cron.start();
    }

    public stop(): void {
        this.#cron.stop();
    }

    #onCron(): void {
        this.#messages.tick().catch(console.error);
    }
}
