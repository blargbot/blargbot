import type { MetricJson } from '@blargbot/metrics-client';
import prom from 'prom-client';

export class MetricsService {
    #metrics: Map<string, Map<string, { timestamp: number; metrics: MetricJson[]; }>>;
    #registry?: prom.Registry;

    public constructor() {
        this.#metrics = new Map();
        this.#registry = new prom.Registry();
    }

    public setMetrics(serviceId: string, instanceId: string, metrics: MetricJson[]): void {
        let serviceMetrics = this.#metrics.get(serviceId);
        if (serviceMetrics === undefined)
            this.#metrics.set(serviceId, serviceMetrics = new Map<string, { timestamp: number; metrics: MetricJson[]; }>());
        let instanceMetrics = serviceMetrics.get(instanceId);
        if (instanceMetrics === undefined)
            serviceMetrics.set(instanceId, instanceMetrics = { metrics: [], timestamp: 0 });
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
        for (const [serviceId, service] of this.#metrics) {
            const metricCount = metrics.length;
            for (const [instanceId, instance] of service) {
                if (instance.timestamp < cutoff)
                    service.delete(instanceId);
                else
                    metrics.push(instance.metrics);
            }
            if (metricCount === metrics.length)
                this.#metrics.delete(serviceId);
        }

        return prom.AggregatorRegistry.aggregate(metrics);
    }
}
