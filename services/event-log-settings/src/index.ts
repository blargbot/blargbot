import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createModLogRequestHandler } from './createUserWarningRequestHandler.js';
import GuildEventLogSequelizeDatabase from './GuildEventLogSequelizeDatabase.js';
import { GuildEventLogService } from './GuildEventLogService.js';

export class EventLogSettingsApplication extends ServiceHost {
    public constructor(options: EventLogSettingsApplicationOptions) {
        const serviceName = 'event-log-settings';
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        super([
            parallelServices(
                connectToService(redis, 'redis'),
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createModLogRequestHandler(new GuildEventLogService(
                        new GuildEventLogSequelizeDatabase(database),
                        new RedisKVCache<{ guildId: bigint; event: string; }, bigint | null>(redis, {
                            ttlS: options.redis.ttl,
                            keyspace: 'event_log',
                            keyFactory: ({ guildId, event }) => `${guildId}:${event}`,
                            serializer: json.bigint.nullable
                        })
                    ))),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new EventLogSettingsApplication({
        port: env.appPort,
        redis: {
            url: env.redisUrl,
            password: env.redisPassword,
            username: env.redisUsername,
            ttl: env.redisTTL
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

export interface EventLogSettingsApplicationOptions {
    readonly port: number;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
        readonly ttl: number;
    };
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
