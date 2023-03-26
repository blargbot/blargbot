import type { MetricsOptions } from './Metrics.js';
import { Metrics } from './Metrics.js';
import { MetricsHttpClient } from './MetricsHttpClient.js';

export type { Counter, Gauge, Histogram, Summary } from 'prom-client';

export class MetricsPushService {
    readonly #client: MetricsHttpClient;
    readonly #interval: number;
    readonly #metrics: Metrics;

    #timer?: NodeJS.Timer;

    public constructor(metrics: Metrics, options?: MetricsPushServiceOptions);
    public constructor(options: MetricsPushServiceOptions & MetricsOptions)
    public constructor(metrics: Metrics | (MetricsPushServiceOptions & MetricsOptions), options: MetricsPushServiceOptions = {}) {
        this.#metrics = metrics instanceof Metrics ? metrics : new Metrics(metrics);
        this.#client = MetricsHttpClient.from(options.client ?? options.metricsUrl ?? process.env['METRICS_URL'], {
            serviceName: this.#metrics.serviceName,
            instanceId: this.#metrics.instanceId
        });
        this.#interval = options.postIntervalMs ?? 30000;
    }

    public start(): void {
        if (this.#timer !== undefined)
            throw new Error('Already started');

        this.#timer = setInterval(() => void this.#sendMetrics(), this.#interval).unref();
    }

    public stop(): void {
        if (this.#timer === undefined)
            throw new Error('Not started');

        clearInterval(this.#timer);
        this.#timer = undefined;
    }

    async #sendMetrics(): Promise<void> {
        const metrics = await this.#metrics.getMetrics();
        try {
            await this.#client.postMetrics(metrics);
        } catch (err) {
            console.error('Failed to submit metrics', err);
        }
    }
}

export interface MetricsPushServiceOptions {
    readonly metricsUrl?: string;
    readonly client?: MetricsHttpClient;
    readonly postIntervalMs?: number;
}
