import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { BBTagExecutionMessageBroker } from '@blargbot/bbtag-runner-client';
import { BBTagVariableHttpClient } from '@blargbot/bbtag-variables-client';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { Metrics, MetricsPushService } from '@blargbot/metrics-client';

import { createBBTagEngine } from './createBBTagEngine.js';

@hostIfEntrypoint(() => [{
    defaultPrefix: env.get(String, 'COMMAND_PREFIX'),
    variables: {
        url: env.bbtagVariablesUrl
    },
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class BBTagRunnerApplication extends ServiceHost {

    public constructor(options: BBTagRunnerApplicationOptions) {
        const serviceName = 'bbtag-runner';
        const hub = new MessageHub(options.messages);
        const executeBroker = new BBTagExecutionMessageBroker(hub, serviceName);
        const metrics = new Metrics({ serviceName, instanceId: fullContainerId });
        const subtagLatency = metrics.histogram({
            name: 'bot_subtag_latency_ms',
            help: 'Latency of subtag execution',
            labelNames: ['subtag'],
            buckets: [0, 5, 10, 100, 500, 1000, 2000, 5000]
        });
        const subtagCount = metrics.counter({
            name: 'bot_subtag_counter',
            help: 'Subtags executed',
            labelNames: ['subtag']
        });
        const engine = createBBTagEngine({
            messages: hub,
            variables: new BBTagVariableHttpClient(options.variables.url),
            metrics: {
                subtagUsed(name, duration) {
                    subtagLatency.labels(name).observe(duration);
                    subtagCount.labels(name).inc();
                }
            }
        });

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService(metrics)
            )
        ]);

        executeBroker;
        engine;
    }
}

export interface BBTagRunnerApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly variables: {
        readonly url: string;
    };
    readonly defaultPrefix: string;
}
