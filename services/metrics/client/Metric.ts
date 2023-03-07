export interface Metric {
    readonly name: string;
    readonly help: string;
    readonly type: MetricType;
    readonly aggregator: 'omit' | 'sum' | 'first' | 'min' | 'max' | 'average';
}

export interface ServiceMetrics {
    readonly serviceName: string;
    readonly instanceId: string;
    readonly metrics: readonly Metric[];
}

enum MetricType {
    COUNTER,
    GAUGE,
    HISTOGRAM,
    SUMMARY,
}
