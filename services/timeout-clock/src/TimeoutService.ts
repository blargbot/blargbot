import { CronJob } from 'cron';

import type { TimeoutMessageBroker } from './TimeoutMessageBroker.js';

export class TimeoutService {
    readonly #messages: TimeoutMessageBroker;
    readonly #cron: CronJob;

    public constructor(cron: string, messages: TimeoutMessageBroker) {
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
        this.#messages.pollTimeouts().catch(console.error);
    }
}
