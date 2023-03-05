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
    },
    discordChannelCache: {
        url: env.discordChannelCacheUrl
    },
    discordGuildCache: {
        url: env.discordGuildCacheUrl
    }
}])
export class DiscordMessageStreamApplication extends Application {
    readonly #messages: DiscordMessageStreamMessageBroker;
    readonly #service: DiscordMessageStreamService;

    public constructor(options: DiscordMessageStreamApplicationOptions) {
        super();

        this.#messages = new DiscordMessageStreamMessageBroker(options.messages);
        this.#service = new DiscordMessageStreamService(this.#messages, {
            discordChannelCacheUrl: options.discordChannelCache.url,
            discordGuildCacheUrl: options.discordGuildCache.url
        });
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
    readonly discordChannelCache: {
        readonly url: string;
    };
    readonly discordGuildCache: {
        readonly url: string;
    };
}
