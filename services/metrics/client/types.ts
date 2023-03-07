import type { Registry } from 'prom-client';

export type MetricJson = Awaited<ReturnType<Registry['getMetricsAsJSON']>>[number]

export interface MetricsMessage {
    readonly instanceId: string;
    readonly serviceName: string;
    readonly metrics: readonly MetricJson[];
}
