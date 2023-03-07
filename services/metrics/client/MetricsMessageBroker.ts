import type { MessageHub } from '@blargbot/message-hub';
import { jsonToBlob } from '@blargbot/message-hub';
import type { Registry } from 'prom-client';

import type { MetricJson, MetricsMessage } from './types.js';

export class MetricsMessageBroker {
    public static readonly exchangeArgs = Object.freeze([
        'metrics',
        'topic',
        Object.freeze({ durable: true })
    ] as const);

    readonly #messages: MessageHub;
    readonly #serviceName: string;
    readonly #instanceId: string;

    public constructor(messages: MessageHub, serviceName: string, instanceId: string) {
        this.#messages = messages;
        this.#serviceName = serviceName;
        this.#instanceId = instanceId;

        this.#messages.onConnected(c => c.assertExchange(...MetricsMessageBroker.exchangeArgs));
    }

    public async postMetrics(metrics: MetricJson[] | Registry): Promise<void> {
        metrics = Array.isArray(metrics) ? metrics : await metrics.getMetricsAsJSON();
        const message: MetricsMessage = {
            metrics,
            instanceId: this.#instanceId,
            serviceName: this.#serviceName
        };
        await this.#messages.publish(MetricsMessageBroker.exchangeArgs[0], this.#serviceName, jsonToBlob(message));
    }
}
