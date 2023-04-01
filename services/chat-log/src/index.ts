import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import type { ChatLogDatabaseOptions } from './ChatLogDatabase.js';
import ChatLogDatabase from './ChatLogDatabase.js';
import { ChatLogService } from './ChatLogService.js';

export class ChatLogApplication extends ServiceHost {
    public constructor(options: ChatLogApplicationOptions) {
        const serviceName = 'chat-log';
        const hub = new MessageHub(options.messages);
        const database = new ChatLogDatabase(options.database);
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new ChatLogService(
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

if (isEntrypoint()) {
    host(new ChatLogApplication({
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
    }));
}

export interface ChatLogApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly database: ChatLogDatabaseOptions;
    readonly guildSettings: {
        readonly url: string;
    };
}
