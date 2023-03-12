import prom from 'prom-client';

import { MetricsHttpClient } from './MetricsHttpClient.js';

export type { Counter, Gauge, Histogram, Summary } from 'prom-client';

export class MetricsClient {
    readonly #client: MetricsHttpClient;
    readonly #registry: prom.Registry;
    readonly #interval: number;
    readonly #scopeLabels: Record<NonNullable<MetricOptions['scope']>, object>;

    #timer?: NodeJS.Timer;

    public constructor(options: MetricsServiceOptions) {
        this.#client = MetricsHttpClient.from(options.client ?? options.metricsUrl ?? process.env['METRICS_URL'], {
            serviceName: options.serviceName,
            instanceId: options.instanceId
        });
        this.#scopeLabels = {
            global: {},
            service: { serviceName: options.serviceName },
            instance: { serviceName: options.serviceName, instanceId: options.instanceId }
        };
        this.#registry = options.registry ?? new prom.Registry();
        this.#interval = options.postIntervalMs ?? 30000;

        prom.collectDefaultMetrics({
            register: this.#registry,
            labels: { ...this.#scopeLabels.instance }
        });
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
        const metrics = await this.#registry.getMetricsAsJSON();
        try {
            await this.#client.postMetrics(metrics);
        } catch (err) {
            console.error('Failed to submit metrics', err);
        }
    }

    #createRegister<Config extends prom.MetricConfiguration<string>, Metric extends prom.Metric>(config: Config & MetricOptions, metric: new (config: Config) => Metric): Metric {
        config.registers ??= [];
        config.registers.unshift(this.#registry);
        const result = new metric(config);
        const get = result.get.bind(result);
        const additionalLabels = this.#scopeLabels[config.scope ?? 'global'];
        result.get = async (...args) => {
            const result = await get(...args);
            for (const value of result.values) {
                Object.assign(value.labels, additionalLabels);
            }
            return result;
        };
        return result;
    }

    public guage<T extends string = string>(options: string | prom.GaugeConfiguration<T> & MetricOptions): prom.Gauge<T> {
        if (typeof options === 'string')
            return this.#getMetric(options, prom.Gauge);
        return this.#createRegister(options, prom.Gauge);
    }

    public counter<T extends string = string>(options: string | prom.CounterConfiguration<T> & MetricOptions): prom.Counter<T> {
        if (typeof options === 'string')
            return this.#getMetric(options, prom.Counter);
        return this.#createRegister(options, prom.Counter);
    }

    public histogram<T extends string = string>(options: string | prom.HistogramConfiguration<T> & MetricOptions): prom.Histogram<T> {
        if (typeof options === 'string')
            return this.#getMetric(options, prom.Histogram);
        return this.#createRegister(options, prom.Histogram);
    }

    public summary<T extends string = string>(options: string | prom.SummaryConfiguration<T> & MetricOptions): prom.Summary<T> {
        if (typeof options === 'string')
            return this.#getMetric(options, prom.Summary);
        return this.#createRegister(options, prom.Summary);
    }

    #getMetric<T extends prom.Metric>(name: string, type: abstract new (...args: never) => T): T {
        const metric = this.#registry.getSingleMetric(name);
        if (metric === undefined)
            throw new Error('Metric not defined');

        if (!(metric instanceof type))
            throw new Error(`Expected ${type.name} metric, but got ${metric.constructor.name}`);

        return metric;
    }
}

export interface MetricsServiceOptions {
    readonly metricsUrl?: string;
    readonly client?: MetricsHttpClient;
    readonly serviceName: string;
    readonly instanceId: string;
    readonly postIntervalMs?: number;
    readonly registry?: prom.Registry;
}

interface MetricOptions {
    readonly scope?: 'global' | 'service' | 'instance';
}
