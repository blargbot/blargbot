import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { DiscordMessageStreamMessageBroker } from './DiscordMessageStreamMessageBroker.js';
import { DiscordMessageStreamService } from './DiscordMessageStreamService.js';

@Application.hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordMessageStreamApplication extends Application {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #service: DiscordMessageStreamService;

    public constructor(options: DiscordMessageStreamApplicationOptions) {
        super();

        this.#messages = new DiscordMessageStreamMessageBroker(options.messages);
        this.#service = new DiscordMessageStreamService(this.#messages);
    }

    protected override async start(): Promise<void> {
        await this.#messages.connect();
        await this.#service.start();
    }

    protected override async stop(): Promise<void> {
        await this.#service.stop();
        await this.#messages.disconnect();
    }
}

export interface DiscordMessageStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
