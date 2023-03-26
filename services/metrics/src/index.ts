import { hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';

import { createMetricsRequestHandler } from './createMetricsRequestHandler.js';
import { MetricsService } from './MetricsService.js';

@hostIfEntrypoint(() => [{
    port: env.appPort
}])
export class MetricsApplication extends ServiceHost {
    public constructor(options: MetricsApplicationOptions) {
        const serviceName = 'metrics';
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });

        super([
            metrics,
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createMetricsRequestHandler(new MetricsService())),
                options.port
            )
        ]);
    }
}

export interface MetricsApplicationOptions {
    readonly port: number;
}
