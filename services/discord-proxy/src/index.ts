import { host, isEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';

import createRestProxy from './createRestProxy.js';
import type { RestProxyOptions } from './RestProxyOptions.js';

const requestLimit = 50 << 20; // 50MB

export default class RestProxyApplication extends ServiceHost {
    public constructor(options: RestProxyApplicationOptions) {
        const serviceName = 'discord-proxy';
        super([
            new MetricsPushService({ serviceName, instanceId: fullContainerId }),
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

if (isEntrypoint()) {
    host(new RestProxyApplication({
        url: env.discordProxyUrl,
        secret: env.discordProxySecret,
        token: env.discordToken,
        port: env.appPort

    }));
}

export interface RestProxyApplicationOptions extends RestProxyOptions {
    readonly port: number;
}
