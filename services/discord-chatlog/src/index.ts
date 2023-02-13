import Application from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-broker';

import type { DiscordChatlogDatabaseOptions } from './DiscordChatlogDatabase.js';
import DiscordChatlogDatabase from './DiscordChatlogDatabase.js';
import { DiscordChatlogMessageBroker } from './DiscordChatlogMessageBroker.js';
import { DiscordChatlogService } from './DiscordChatlogService.js';

@Application.hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    database: {
        contactPoints: env.cassandraContactPoints,
        keyspace: env.cassandraKeyspace,
        username: env.cassandraUsername,
        password: env.cassandraPassword
    },
    guildSettings: {
        url: env.guildSettingsUrl
    }
}])
export class DiscordChatlogApplication extends Application {
    readonly #messages: DiscordChatlogMessageBroker;
    readonly #database: DiscordChatlogDatabase;
    readonly #service: DiscordChatlogService;

    public constructor(options: DiscordChatlogApplicationOptions) {
        super();

        this.#messages = new DiscordChatlogMessageBroker(options.messages);
        this.#database = new DiscordChatlogDatabase(options.database);
        this.#service = new DiscordChatlogService(this.#messages, this.#database, {
            guildSettingsUrl: options.guildSettings.url
        });
    }

    protected override async start(): Promise<void> {
        await Promise.all([
            this.#messages.connect(),
            this.#database.connect()
        ]);
        await this.#service.start();
    }

    protected override async stop(): Promise<void> {
        await this.#service.stop();
        await Promise.all([
            this.#messages.disconnect(),
            this.#database.disconnect()
        ]);
    }
}

export interface DiscordChatlogApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly database: DiscordChatlogDatabaseOptions;
    readonly guildSettings: {
        readonly url: string;
    };
}
