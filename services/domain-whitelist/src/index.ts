import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createDomainWhitelistRequestHandler } from './createDomainWhitelistRequestHandler.js';
import DomainWhitelistDatabase from './DomainWhitelistDatabase.js';
import { DomainWhitelistService } from './DomainWhitelistService.js';

export class DomainWhitelistApplication extends ServiceHost {
    public constructor(options: DomainWhitelistApplicationOptions) {
        const serviceName = 'domain-whitelist';
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
                    .all('/*', createDomainWhitelistRequestHandler(new DomainWhitelistService(
                        new DomainWhitelistDatabase(database),
                        new RedisKVCache<string, boolean>(redis, {
                            ttlS: options.redis.ttl,
                            keyspace: 'domain_whitelisted'
                        })))),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new DomainWhitelistApplication({
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

export interface DomainWhitelistApplicationOptions {
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
