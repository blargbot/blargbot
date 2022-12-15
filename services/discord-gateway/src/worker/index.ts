import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Application from '@blargbot/application';
import wellKnown, { getEnvVar } from '@blargbot/env';

import type { GatewayMessageBrokerOptions } from '../GatewayMessageBroker.js';
import { GatewayMessageBroker } from '../GatewayMessageBroker.js';
import type { DiscordShardManager } from './DiscordShardManager.js';
import { createDiscordShardManager } from './DiscordShardManager.js';

export const workerPath = path.dirname(fileURLToPath(import.meta.url));

@Application.hostIfEntrypoint({
    messages: {
        host: wellKnown.rabbitHost,
        password: wellKnown.rabbitPassword,
        username: wellKnown.rabbitUsername,
        managerId: getEnvVar(String, 'MANAGER_ID')
    },
    lastShardId: getEnvVar(Number, 'LAST_SHARD_ID'),
    workerId: getEnvVar(Number, 'WORKER_ID'),
    token: wellKnown.discordToken
})
export class DiscordGatewayWorkerApplication extends Application {
    readonly #options: DiscordGatewayWorkerApplicationOptions;
    readonly #messages: GatewayMessageBroker;
    readonly #manager: DiscordShardManager;

    public constructor(options: DiscordGatewayWorkerApplicationOptions) {
        super();
        this.#options = options;
        this.#messages = new GatewayMessageBroker(this.#options.messages);
        this.#manager = createDiscordShardManager({
            messages: this.#messages,
            lastShardId: options.lastShardId,
            token: options.token,
            workerId: options.workerId
        });
    }

    protected override async start(): Promise<void> {
        await this.#messages.connect();
        await this.#manager.start();
        process.send?.('started');
    }

    protected override async stop(): Promise<void> {
        await this.#manager.stop();
        await this.#messages.disconnect();
        process.send?.('stopped');
    }
}

interface DiscordGatewayWorkerApplicationOptions {
    readonly messages: GatewayMessageBrokerOptions;
    readonly lastShardId: number;
    readonly workerId: number;
    readonly token: string;
}
