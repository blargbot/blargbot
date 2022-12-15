import Application from '@blargbot/application';
import wellKnown from '@blargbot/env';
import { randomUUID } from 'crypto';
import type * as discordeno from 'discordeno';

import type { GatewayMessageBrokerOptions } from '../GatewayMessageBroker.js';
import { GatewayMessageBroker } from '../GatewayMessageBroker.js';
import type { DiscordGatewayManager } from './DiscordGatewayManager.js';
import { createDiscordGatewayManager } from './DiscordGatewayManager.js';
import { createDiscordRestClient } from './DiscordRestClient.js';

@Application.hostIfEntrypoint({
    messages: {
        host: wellKnown.rabbitHost,
        username: wellKnown.rabbitUsername,
        password: wellKnown.rabbitPassword,
        managerId: randomUUID()
    },
    rest: {
        url: wellKnown.restProxyUrl,
        secret: wellKnown.restProxySecret
    },
    token: wellKnown.discordToken,
    shardsPerWorker: wellKnown.shardsPerWorker
})
export class DiscordGatewayApplication extends Application {
    readonly #options: DiscordGatewayApplicationOptions;
    readonly #client: discordeno.Bot;
    readonly #messages: GatewayMessageBroker;

    #managerVal?: DiscordGatewayManager;
    get #manager(): DiscordGatewayManager {
        if (this.#managerVal === undefined)
            throw new Error('Application not started yet');
        return this.#managerVal;
    }
    set #manager(value: DiscordGatewayManager | undefined) {
        if (this.#managerVal !== undefined)
            throw new Error('Application already started');
        this.#managerVal = value;
    }

    public constructor(options: DiscordGatewayApplicationOptions) {
        super();
        this.#options = options;
        this.#messages = new GatewayMessageBroker(this.#options.messages);
        this.#client = createDiscordRestClient({
            token: this.#options.token,
            url: this.#options.rest.url,
            secret: this.#options.rest.secret
        });
    }

    protected override async start(): Promise<void> {
        await this.#messages.connect();
        this.#manager = createDiscordGatewayManager({
            messages: this.#messages,
            gatewayBot: await this.#client.helpers.getGatewayBot(),
            shardsPerWorker: this.#options.shardsPerWorker,
            token: this.#options.token
        });
        await this.#manager.start();
    }

    protected override async stop(): Promise<void> {
        await this.#manager.stop();
        await this.#messages.disconnect();
        this.#manager = undefined;
    }
}

export interface DiscordGatewayApplicationOptions {
    readonly messages: GatewayMessageBrokerOptions;
    readonly rest: {
        readonly secret: string;
        readonly url: string;
    };
    readonly token: string;
    readonly shardsPerWorker: number;
}
