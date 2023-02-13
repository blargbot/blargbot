import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';
import { DiscordReactionStreamService } from './DiscordReactionStreamService.js';

@Application.hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordReactionStreamApplication extends Application {
    readonly #messages: DiscordReactionStreamMessageBroker;
    readonly #service: DiscordReactionStreamService;

    public constructor(options: DiscordReactionStreamApplicationOptions) {
        super();

        this.#messages = new DiscordReactionStreamMessageBroker(options.messages);
        this.#service = new DiscordReactionStreamService(this.#messages);
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

export interface DiscordReactionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
