import { SubtagInvocationContext, SubtagInvocationMiddleware } from "@bbtag/blargbot";
import { Counter, Histogram, Metrics } from "@blargbot/metrics-client";

export class MetricsService {
    readonly #subtagLatency: Histogram<"subtag">;
    readonly #subtagCount: Counter<"subtag">;

    public readonly subtagMiddleware: SubtagInvocationMiddleware

    public constructor(metrics: Metrics) {
        this.#subtagLatency = metrics.histogram({
            name: 'bot_subtag_latency_ms',
            help: 'Latency of subtag execution',
            labelNames: ['subtag'],
            buckets: [0, 5, 10, 100, 500, 1000, 2000, 5000]
        });
        this.#subtagCount = metrics.counter({
            name: 'bot_subtag_counter',
            help: 'Subtags executed',
            labelNames: ['subtag']
        })

        this.subtagMiddleware = this.#subtagMiddleware.bind(this);
    }


    async #subtagMiddleware({ subtag }: SubtagInvocationContext, next: () => Awaitable<string>): Promise<string> {
        const start = performance.now();
        try {
            return await next();
        } finally {
            this.#subtagLatency.labels(subtag.id).observe(performance.now() - start);
            this.#subtagCount.labels(subtag.id).inc();
        }
    }
}