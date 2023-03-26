import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { TimeoutClockMessageBroker } from '@blargbot/timeout-clock-client';

import { TimeoutService } from './TimeoutService.js';

@hostIfEntrypoint(() => [{
    cron: env.get(String, 'TIMEOUT_CRON'),
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class TimeoutClockApplication extends ServiceHost {
    public constructor(options: GuildSettingsApplicationOptions) {
        const serviceName = 'timeout-clock';
        const hub = new MessageHub(options.messages);

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            new TimeoutService(
                options.cron,
                new TimeoutClockMessageBroker(hub, serviceName)
            )
        ]);
    }
}

export interface GuildSettingsApplicationOptions {
    readonly cron: string;
    readonly messages: ConnectionOptions;
}
