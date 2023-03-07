import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsMessageBroker, MetricsService } from '@blargbot/metrics-client';

import { createBBTagEngine } from './createBBTagEngine.js';
import { ImageMessageBroker } from './ImageMessageBroker.js';

@hostIfEntrypoint(() => [{
    defaultPrefix: env.get(String, 'COMMAND_PREFIX'),
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class ImageGeneratorApplication extends ServiceHost {

    public constructor(options: ImageGeneratorApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const imageBroker = new ImageMessageBroker(messages);
        const engine = createBBTagEngine({
            defaultPrefix: options.defaultPrefix,
            metrics: {
                subtagUsed(name, duration) {
                    name;
                    duration;
                    throw null;
                }
            }
        });

        super([
            connectionToService(messages, 'rabbitmq'),
            new MetricsService(new MetricsMessageBroker(messages, 'bbtag-runner', '0'))
        ]);

        imageBroker;
        engine;
    }
}

export interface ImageGeneratorApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly defaultPrefix: string;
}
