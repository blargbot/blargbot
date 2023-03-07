import type { Registry } from 'prom-client';

export type MetricJson = Awaited<ReturnType<Registry['getMetricsAsJSON']>>[number]
