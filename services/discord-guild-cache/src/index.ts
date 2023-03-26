import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type { SlimDiscordGuild } from '@blargbot/discord-guild-cache-client';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createGuildCacheRequestHandler } from './createGuildCacheRequestHandler.js';
import { DiscordGuildCacheService } from './DiscordGuildCacheService.js';

@hostIfEntrypoint(() => [{
    port: env.appPort,
    redis: {
        url: env.redisUrl,
        password: env.redisPassword,
        username: env.redisUsername
    },
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordGuildCacheApplication extends ServiceHost {
    public constructor(options: DiscordGuildCacheApplicationOptions) {
        const serviceName = 'discord-guild-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordGuildCacheService(
            new RedisKVCache<bigint, SlimDiscordGuild>(redis, {
                ttlS: null,
                keyspace: 'discord_guilds'
            })
        );

        super([
            parallelServices(
                connectToService(redis, 'redis'),
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => gateway.handleGuildCreate(m => service.handleGuildCreate(m)), 'handleGuildCreate'),
                connectToService(() => gateway.handleGuildUpdate(m => service.handleGuildUpdate(m)), 'handleGuildUpdate'),
                connectToService(() => gateway.handleGuildDelete(m => service.handleGuildDelete(m)), 'handleGuildDelete')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createGuildCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface DiscordGuildCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
