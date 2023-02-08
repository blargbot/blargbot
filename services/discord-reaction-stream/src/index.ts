import Application from '@blargbot/application';
import env from '@blargbot/env';

import type { DiscordReactionStreamMessageBrokerOptions } from './DiscordReactionStreamMessageBroker.js';
import { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';
import { DiscordReactionStreamService } from './DiscordReactionStreamService.js';

@Application.hostIfEntrypoint(() => [{
    messages: {
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordReactionStreamApplication extends Application {
    readonly #messages: DiscordReactionStreamMessageBroker;
    readonly #service: DiscordReactionStreamService;

    public constructor(options: DiscordChatlogApplicationOptions) {
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

export interface DiscordChatlogApplicationOptions {
    readonly messages: DiscordReactionStreamMessageBrokerOptions;
}
