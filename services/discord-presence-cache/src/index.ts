import { connectionToService, hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKKVCache } from '@blargbot/redis-cache';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createPresenceCacheRequestHandler } from './createPresenceCacheRequestHandler.js';
import { DiscordPresenceCacheService } from './DiscordPresenceCacheService.js';
import type { DiscordUserPresence } from './DiscordUserPresence.js';

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
export class DiscordPresenceCacheApplication extends ServiceHost {
    public constructor(options: DiscordPresenceCacheApplicationOptions) {
        const serviceName = 'discord-presence-cache';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const service = new DiscordPresenceCacheService(
            new DiscordGatewayMessageBroker(messages, serviceName),
            new RedisKKVCache<bigint, bigint, DiscordUserPresence>(redis, {
                ttlS: null,
                keyspace: 'discord_presence',
                key2Reader: v => BigInt(v)
            })
        );

        super([
            connectionToService(redis, 'redis'),
            connectionToService(messages, 'rabbitmq'),
            metrics,
            service,
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createPresenceCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface DiscordPresenceCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
