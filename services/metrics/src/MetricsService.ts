import type { MetricJson } from '@blargbot/metrics-client';
import prom from 'prom-client';

export class MetricsService {
    #metrics: Record<string, Record<string, { timestamp: number; metrics: MetricJson[]; }>>;
    #registry?: prom.Registry;

    public constructor() {
        this.#metrics = {};
        this.#registry = new prom.Registry();
    }

    public setMetrics(serviceId: string, instanceId: string, metrics: MetricJson[]): void {
        const serviceMetrics = this.#metrics[serviceId] ??= {};
        const instanceMetrics = serviceMetrics[instanceId] ??= { metrics: [], timestamp: 0 };
        instanceMetrics.metrics = metrics;
        instanceMetrics.timestamp = Date.now();
        this.#registry = undefined;
    }

    public aggregateMetrics(): prom.Registry {
        return this.#registry ??= this.#createRegistry();
    }

    #createRegistry(): prom.Registry {
        const metrics = [];
        const cutoff = Date.now() - 60000;
        for (const [serviceId, service] of Object.entries(this.#metrics)) {
            const metricCount = metrics.length;
            for (const [instanceId, instance] of Object.entries(service)) {
                if (instance.timestamp < cutoff)
                    delete service[instanceId];
                else
                    metrics.push(instance.metrics);
            }
            if (metricCount === metrics.length)
                delete this.#metrics[serviceId];
        }

        return prom.AggregatorRegistry.aggregate(metrics);
    }
}
