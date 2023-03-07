import prom from 'prom-client';

import type { MetricsMessageBroker } from './MetricsMessageBroker.js';

export type { Counter, Gauge, Histogram, Summary } from 'prom-client';

export class MetricsService {
    readonly #messages: MetricsMessageBroker;
    readonly #registry: prom.Registry;
    readonly #interval: number;

    #timer?: NodeJS.Timer;

    public constructor(messages: MetricsMessageBroker, options: MetricsServiceOptions) {
        this.#messages = messages;
        this.#registry = options.registry ?? new prom.Registry();

        prom.collectDefaultMetrics({
            register: this.#registry,
            labels: {
                serviceName: options.serviceName.replaceAll('-', '_'),
                instanceId: options.instanceId
            }
        });

        this.#interval = options.postIntervalMs ?? 30000;
    }

    public start(): void {
        if (this.#timer !== undefined)
            throw new Error('Already started');

        this.#timer = setInterval(() => {
            this.#messages.postMetrics(this.#registry).catch(err => console.error('Error while submitting metrics', err));
        }, this.#interval);
    }

    public stop(): void {
        if (this.#timer === undefined)
            throw new Error('Not started');

        clearInterval(this.#timer);
        this.#timer = undefined;
    }

    #setRegister<T extends prom.MetricConfiguration<R>, R extends string>(config: T): T {
        return {
            ...config,
            registers: [this.#registry, ...config.registers ?? []]
        };
    }

    public guage<T extends string = string>(options: prom.GaugeConfiguration<T>): prom.Gauge<T> {
        return new prom.Gauge(this.#setRegister(options));
    }

    public counter<T extends string = string>(options: prom.CounterConfiguration<T>): prom.Counter<T> {
        return new prom.Counter(this.#setRegister(options));
    }

    public histogram<T extends string = string>(options: prom.HistogramConfiguration<T>): prom.Histogram<T> {
        return new prom.Histogram(this.#setRegister(options));
    }

    public summary<T extends string = string>(options: prom.SummaryConfiguration<T>): prom.Summary<T> {
        return new prom.Summary(this.#setRegister(options));
    }
}

export interface MetricsServiceOptions {
    readonly postIntervalMs?: number;
    readonly registry?: prom.Registry;
    readonly serviceName: string;
    readonly instanceId: string;
}
