import prom from 'prom-client';

export class Metrics {
    readonly #registry: prom.Registry;
    readonly #scopeLabels: Record<NonNullable<MetricOptions['scope']>, object>;

    public readonly serviceName: string;
    public readonly instanceId: string;

    public constructor(options: MetricsOptions) {
        this.serviceName = options.serviceName;
        this.instanceId = options.instanceId;

        this.#scopeLabels = {
            global: {},
            service: { serviceName: options.serviceName },
            instance: { serviceName: options.serviceName, instanceId: options.instanceId }
        };
        this.#registry = options.registry ?? new prom.Registry();

        prom.collectDefaultMetrics({
            register: this.#registry,
            labels: { ...this.#scopeLabels.instance }
        });
    }

    public async getMetrics(): ReturnType<prom.Registry['getMetricsAsJSON']> {
        return await this.#registry.getMetricsAsJSON();
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

interface MetricOptions {
    readonly scope?: 'global' | 'service' | 'instance';
}

export interface MetricsOptions {
    readonly serviceName: string;
    readonly instanceId: string;
    readonly registry?: prom.Registry;
}
