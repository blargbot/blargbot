import type { BBTagScript, DeferredExecutionService as BBTagDeferredExecutionService } from '@bbtag/blargbot';
import type { BBTagExecutionRequest } from '@blargbot/bbtag-runner-client';
import { jsonToBlob } from '@blargbot/message-hub';
import type { SchedulerHttpClient } from '@blargbot/scheduler-client';

export class DeferredExecutionService implements BBTagDeferredExecutionService {
    readonly #scheduler: SchedulerHttpClient;
    readonly #queueName: string;

    public constructor(scheduler: SchedulerHttpClient, queueName: string) {
        this.#scheduler = scheduler;
        this.#queueName = queueName;
    }

    public async defer(context: BBTagScript, content: string, delayMs: number): Promise<void> {
        const request: BBTagExecutionRequest = {
            user: context.runtime.user
        };

        await this.#scheduler.scheduleMessage({
            data: await jsonToBlob(request),
            display: content,
            end: new Date(Date.now() + delayMs),
            options: {},
            ownerId: BigInt(context.runtime.guild.id),
            queue: this.#queueName,
            start: new Date(),
            userId: BigInt(context.runtime.user.id)
        });
    }
}
