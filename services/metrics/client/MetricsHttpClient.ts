import type { HttpClient, HttpClientOptions } from '@blargbot/api-client';
import { defineApiClient, jsonBody } from '@blargbot/api-client';
import type { Registry } from 'prom-client';

export type MetricJson = Awaited<ReturnType<Registry['getMetricsAsJSON']>>[number]

export interface MetricsHttpClientConfig {
    readonly serviceName: string;
    readonly instanceId: string;
}

export class MetricsHttpClient extends defineApiClient(b => b.withConfig<MetricsHttpClientConfig>(), {
    postMetrics: b => b.route<readonly MetricJson[]>('POST', (_, x) => `${x.serviceName}/${x.instanceId}`)
        .body(x => jsonBody(x))
        .response(204),
    getAllMetrics: b => b.route('')
        .response(200, b => b.text())
}) {

    public static from(options: MetricsHttpClient | HttpClient | HttpClientOptions | string | URL | undefined, config: MetricsHttpClientConfig): MetricsHttpClient {
        if (options instanceof MetricsHttpClient)
            return options;
        if (options === undefined)
            throw new Error('No configuration provided for client');
        return new MetricsHttpClient(options, config);
    }
}
