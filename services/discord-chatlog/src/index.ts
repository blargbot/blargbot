import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

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
        const hub = new MessageHub(options.messages);
        const database = new DiscordChatlogDatabase(options.database);
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordChatlogService(
            database,
            {
                guildSettingsUrl: options.guildSettings.url
            }
        );
        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                connectToService(database, 'cassandra'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => gateway.handleMessageCreate(m => service.handleMessageCreate(m)), 'handleMessageCreate'),
                connectToService(() => gateway.handleMessageUpdate(m => service.handleMessageUpdate(m)), 'handleMessageUpdate'),
                connectToService(() => gateway.handleMessageDelete(m => service.handleMessageDelete(m)), 'handleMessageDelete'),
                connectToService(() => gateway.handleMessageDeleteBulk(m => service.handleMessageDeleteBulk(m)), 'handleMessageDeleteBulk')
            )
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
