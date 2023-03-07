import { connectionToService, hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';

import { createMetricsRequestHandler } from './createMetricsRequestHandler.js';
import { MetricsMessageBroker } from './MetricsMessageBroker.js';
import { MetricsService } from './MetricsService.js';

@hostIfEntrypoint(() => [{
    port: env.appPort,
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class MetricsApplication extends ServiceHost {
    public constructor(options: MetricsApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const service = new MetricsService(
            new MetricsMessageBroker(messages)
        );

        super([
            connectionToService(messages, 'rabbitmq'),
            service,
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createMetricsRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface MetricsApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly port: number;
}
