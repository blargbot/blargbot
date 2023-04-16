import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { SchedulerClockMessageBroker } from '@blargbot/scheduler-clock-client';

import { SchedulerClockService } from './SchedulerClockService.js';

export class SchedulerClockApplication extends ServiceHost {
    public constructor(options: GuildSettingsApplicationOptions) {
        const serviceName = 'scheduler-clock';
        const hub = new MessageHub(options.messages);

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            new SchedulerClockService(
                options.cron,
                new SchedulerClockMessageBroker(hub, serviceName)
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new SchedulerClockApplication({
        cron: env.get(String, 'SCHEDULER_CRON'),
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        }
    }));
}

export interface GuildSettingsApplicationOptions {
    readonly cron: string;
    readonly messages: ConnectionOptions;
}
