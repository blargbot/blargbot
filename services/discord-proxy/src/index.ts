import { hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import { MetricsPushService } from '@blargbot/metrics-client';
import express from 'express';

import createRestProxy from './createRestProxy.js';
import type { RestProxyOptions } from './RestProxyOptions.js';

const requestLimit = 50 << 20; // 50MB

@hostIfEntrypoint(() => [{
    url: env.discordProxyUrl,
    secret: env.discordProxySecret,
    token: env.discordToken,
    port: env.appPort
}])
export default class RestProxyApplication extends ServiceHost {
    public constructor(options: RestProxyApplicationOptions) {
        const serviceName = 'discord-proxy';
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });
        super([
            metrics,
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json({ limit: requestLimit }))
                    .all('/*', createRestProxy(options)),
                options.port
            )
        ]);
    }
}

export interface RestProxyApplicationOptions extends RestProxyOptions {
    readonly port: number;
}
