import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { BBTagSourceMessageBroker } from '@blargbot/bbtag-source-client';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

export class BBTagSourceApplication extends ServiceHost {
    public constructor(options: BBTagSourceApplicationOptions) {
        const serviceName = 'bbtag-source';
        const hub = new MessageHub(options.messages);
        const sourceRequests = new BBTagSourceMessageBroker(hub, serviceName);

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            connectToService(() => sourceRequests.handleDroppedBBTagSourceRequest(() => undefined), 'handleDroppedBBTagSourceRequest')
        ]);
    }
}

if (isEntrypoint()) {
    host(new BBTagSourceApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        }
    }));
}

export interface BBTagSourceApplicationOptions {
    readonly messages: ConnectionOptions;
}
