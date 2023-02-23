import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { DiscordInteractionStreamMessageBroker } from './DiscordInteractionStreamMessageBroker.js';
import { DiscordInteractionStreamService } from './DiscordInteractionStreamService.js';

@Application.hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordInteractionStreamApplication extends Application {
    readonly #messages: DiscordInteractionStreamMessageBroker;
    readonly #service: DiscordInteractionStreamService;

    public constructor(options: DiscordInteractionStreamApplicationOptions) {
        super();

        this.#messages = new DiscordInteractionStreamMessageBroker(options.messages);
        this.#service = new DiscordInteractionStreamService(this.#messages);
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

export interface DiscordInteractionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
