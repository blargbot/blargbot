import type { BBTagEngine } from '@bbtag/blargbot';
import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { createBBTagEngine } from './createBBTagEngine.js';
import { ImageMessageBroker } from './ImageMessageBroker.js';

@Application.hostIfEntrypoint(() => [{
    defaultPrefix: env.get(String, 'COMMAND_PREFIX'),
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class ImageGeneratorApplication extends Application {
    readonly #messages: ImageMessageBroker;
    readonly #engine: BBTagEngine;

    public constructor(options: ImageGeneratorApplicationOptions) {
        super();

        this.#engine = createBBTagEngine({
            defaultPrefix: options.defaultPrefix,
            metrics: {
                subtagUsed(name, duration) {
                    name;
                    duration;
                    throw null;
                }
            }
        });

        this.#messages = new ImageMessageBroker(options.messages);
    }

    protected override async start(): Promise<void> {
        this.#engine;
        await this.#messages.connect();
    }

    protected override async stop(): Promise<void> {
        await this.#messages.disconnect();
    }
}

export interface ImageGeneratorApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly defaultPrefix: string;
}
