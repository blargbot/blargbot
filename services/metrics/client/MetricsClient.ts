import type { IncomingMessage } from 'http';
import { request } from 'http';
import prom from 'prom-client';

export type { Counter, Gauge, Histogram, Summary } from 'prom-client';

export class MetricsClient {
    readonly #metricsUrl: URL;
    readonly #registry: prom.Registry;
    readonly #interval: number;

    #timer?: NodeJS.Timer;

    readonly #scopeLabels: Record<NonNullable<MetricOptions['scope']>, object>;

    public constructor(options: MetricsServiceOptions) {
        const metricsUrl = options.metricsUrl ?? process.env['METRICS_URL'];
        if (metricsUrl === undefined)
            throw new Error('metricsUrl must be supplied when there is no METRICS_URL environment variable');
        this.#metricsUrl = new URL(`${options.serviceName}/${options.instanceId}`, metricsUrl);
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
        const response = await new Promise<IncomingMessage>(res => request(this.#metricsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, res).end(JSON.stringify(metrics)));
        const data = await new Promise<Buffer>((res, rej) => {
            const chunks: Uint8Array[] = [];
            response.on('data', c => chunks.push(c as Uint8Array));
            response.on('end', () => res(Buffer.concat(chunks)));
            response.on('error', err => rej(err));
        });
        if (response.statusCode !== 204) {
            console.error('Failed to submit metrics', response.statusCode, response.statusMessage, data.toString('utf8').slice(0, 200));
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
    readonly serviceName: string;
    readonly instanceId: string;
    readonly postIntervalMs?: number;
    readonly registry?: prom.Registry;
}

interface MetricOptions {
    readonly scope?: 'global' | 'service' | 'instance';
}
