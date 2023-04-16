import type { SchedulerClockMessageBroker } from '@blargbot/scheduler-clock-client';
import { CronJob } from 'cron';

export class SchedulerClockService {
    readonly #messages: SchedulerClockMessageBroker;
    readonly #cron: CronJob;

    public constructor(cron: string, messages: SchedulerClockMessageBroker) {
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
