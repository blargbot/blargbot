import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import discordeno from '@blargbot/discordeno';
import env from '@blargbot/env';
import { GuildSettingsHttpClient } from '@blargbot/guild-settings-client';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { ModLogMessageBroker } from '@blargbot/mod-log-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import DiscordModLogSequelizeDatabase from './DiscordModLogSequelizeDatabase.js';
import { DiscordModLogService } from './DiscordModLogService.js';

export class DiscordModLogApplication extends ServiceHost {
    public constructor(options: DiscordModLogApplicationOptions) {
        const serviceName = 'discord-mod-log';
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );
        const hub = new MessageHub(options.messages);
        const modLog = new ModLogMessageBroker(hub, serviceName);
        const service = new DiscordModLogService(
            new GuildSettingsHttpClient(options.guildSettings.url),
            new DiscordModLogSequelizeDatabase(database),
            discordeno.useRestErrors(discordeno.createProxiedBot(options.discord)),
            {
                prefix: options.prefix
            }
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => modLog.handleModLogCreated(m => service.handleModLogCreated(m)), 'handleModLogCreated'),
                connectToService(() => modLog.handleModLogDeleted(m => service.handleModLogDeleted(m)), 'handleModLogDeleted'),
                connectToService(() => modLog.handleModLogUpdated(m => service.handleModLogUpdated(m)), 'handleModLogUpdated')
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordModLogApplication({
        guildSettings: {
            url: env.guildSettingsUrl
        },
        prefix: env.get(String, 'COMMAND_PREFIX'),
        discord: {
            token: env.discordToken,
            rest: {
                customUrl: env.discordProxyUrl,
                secretKey: env.discordProxySecret
            }
        },
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
        postgres: {
            user: env.postgresUser,
            pass: env.postgresPassword,
            database: env.postgresDatabase,
            sequelize: {
                host: env.postgresHost
            }
        }

    }));
}

export interface DiscordModLogApplicationOptions {
    readonly guildSettings: {
        readonly url: string;
    };
    readonly prefix: string;
    readonly discord: discordeno.CreateProxiedBotOptions;
    readonly messages: ConnectionOptions;
    readonly postgres: {
        readonly user: string;
        readonly pass: string;
        readonly database: string;
        readonly sequelize: {
            readonly host?: string;
            readonly pool?: {
                readonly max: number;
                readonly min: number;
                readonly acquire: number;
                readonly idle: number;
            };
        };
    };
}
