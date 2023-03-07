import type { MessageHub } from '@blargbot/message-hub';
import { jsonToBlob } from '@blargbot/message-hub';
import type { Registry } from 'prom-client';

import type { MetricJson } from './types.js';

export class MetricsMessageBroker {
    public static readonly exchangeArgs = Object.freeze([
        'metrics',
        'topic',
        Object.freeze({ durable: true })
    ] as const);

    readonly #messages: MessageHub;

    public constructor(messages: MessageHub) {
        this.#messages = messages;

        this.#messages.onConnected(c => c.assertExchange(...MetricsMessageBroker.exchangeArgs));
    }

    public async postMetrics(metrics: MetricJson[] | Registry): Promise<void> {
        metrics = Array.isArray(metrics) ? metrics : await metrics.getMetricsAsJSON();
        await this.#messages.publish(MetricsMessageBroker.exchangeArgs[0], '', jsonToBlob(metrics));
    }
}
