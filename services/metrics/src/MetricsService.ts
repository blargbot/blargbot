import type { MessageHandle } from '@blargbot/message-hub';
import type { MetricJson } from '@blargbot/metrics-client';
import prom from 'prom-client';

import type { MetricsMessageBroker } from './MetricsMessageBroker.js';

export class MetricsService {
    readonly #handles: Set<MessageHandle>;
    readonly #messages: MetricsMessageBroker;
    #metrics: Array<readonly MetricJson[]>;
    #registry: Promise<prom.Registry>;

    public constructor(
        messages: MetricsMessageBroker
    ) {
        this.#messages = messages;
        this.#handles = new Set();
        this.#metrics = [];
        this.#registry = Promise.resolve(new prom.Registry());
    }

    public async start(): Promise<void> {
        await Promise.all([
            this.#messages.handleMetrics(this.#handleMetrics.bind(this)).then(h => this.#handles.add(h))
        ]);
    }

    public async stop(): Promise<void> {
        await Promise.all([...this.#handles]
            .map(h => h.disconnect().finally(() => this.#handles.delete(h))));
    }

    #handleMetrics(metrics: MetricJson[]): void {
        this.#metrics.push(metrics);
    }

    public getRegistry(): Promise<prom.Registry> {
        if (this.#metrics.length === 0)
            return this.#registry;

        const metrics = this.#metrics;
        this.#metrics = [];

        return this.#registry = this.#getRegistry(this.#registry, metrics);
    }

    async #getRegistry(registry: Promise<prom.Registry>, metrics: Array<readonly MetricJson[]>): Promise<prom.Registry> {
        const r = await registry;
        metrics.unshift(await r.getMetricsAsJSON());
        return prom.AggregatorRegistry.aggregate(metrics);
    }
}
