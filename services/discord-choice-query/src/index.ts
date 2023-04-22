import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordChoiceQueryMessageBroker } from '@blargbot/discord-choice-query-client';
import { DiscordInteractionStreamMessageBroker } from '@blargbot/discord-interaction-stream-client';
import discordeno from '@blargbot/discordeno';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { SchedulerClockMessageBroker } from '@blargbot/scheduler-clock-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import DiscordChoiceQueryDatabase from './DiscordChoiceQueryDatabase.js';
import { DiscordChoiceQueryService } from './DiscordChoiceQueryService.js';

export class DiscordChoiceQueryApplication extends ServiceHost {
    public constructor(options: DiscordChoiceQueryApplicationOptions) {
        const serviceName = 'discord-choice-query';
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
        const messages = new DiscordChoiceQueryMessageBroker(hub, serviceName);
        const interactions = new DiscordInteractionStreamMessageBroker(hub, serviceName);
        const clock = new SchedulerClockMessageBroker(hub, serviceName);
        const customIds = {
            cancel: `${serviceName}-cancel`,
            select: `${serviceName}-select`,
            nextPage: `${serviceName}-next-page`,
            prevPage: `${serviceName}-prev-page`
        };
        const service = new DiscordChoiceQueryService(
            messages,
            new DiscordChoiceQueryDatabase(database),
            discordeno.useRestErrors(discordeno.createProxiedBot(options.discord)),
            {
                customIds
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
                connectToService(() => messages.handleQueryRequest(async (r, m) => {
                    if (m.replyTo !== undefined && m.requestId !== undefined)
                        await service.createQuery(r, m.replyTo, m.requestId);
                }), 'handleQueryRequest'),
                connectToService(() => interactions.handleInteraction('component', m => service.handleInteraction(m), {
                    name: 'lookup-components',
                    persistent: true,
                    id: Object.values(customIds)
                }), 'handleInteraction'),
                connectToService(() => clock.handleTick(() => service.sweepTimeouts()), 'handleTick')
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordChoiceQueryApplication({
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

export interface DiscordChoiceQueryApplicationOptions {
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
