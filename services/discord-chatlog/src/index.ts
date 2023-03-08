import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import type { DiscordChatlogDatabaseOptions } from './DiscordChatlogDatabase.js';
import DiscordChatlogDatabase from './DiscordChatlogDatabase.js';
import { DiscordChatlogService } from './DiscordChatlogService.js';

@hostIfEntrypoint(() => [{
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
export class DiscordChatlogApplication extends ServiceHost {
    public constructor(options: DiscordChatlogApplicationOptions) {
        const serviceName = 'discord-chatlog';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });
        const database = new DiscordChatlogDatabase(options.database);
        const service = new DiscordChatlogService(
            new DiscordGatewayMessageBroker(messages, serviceName),
            database,
            {
                guildSettingsUrl: options.guildSettings.url
            }
        );
        super([
            connectionToService(messages, 'rabbitmq'),
            connectionToService(database, 'cassandra'),
            metrics,
            service
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
