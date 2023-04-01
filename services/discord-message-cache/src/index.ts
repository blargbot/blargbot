import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createMessageCacheRequestHandler } from './createMessageCacheRequestHandler.js';
import { DiscordMessageCacheService } from './DiscordMessageCacheService.js';

export class DiscordMessageCacheApplication extends ServiceHost {
    public constructor(options: DiscordMessageCacheApplicationOptions) {
        const serviceName = 'discord-message-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordMessageCacheService(
            new RedisKVCache<bigint, bigint>(redis, {
                ttlS: null,
                keyspace: 'discord_channels:last_message_id',
                serializer: json.bigint
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
                connectToService(() => gateway.handleChannelCreate(m => service.handleChannelCreate(m)), 'handleChannelCreate'),
                connectToService(() => gateway.handleMessageCreate(m => service.handleMessageCreate(m)), 'handleMessageCreate')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createMessageCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordMessageCacheApplication({
        port: env.appPort,
        redis: {
            url: env.redisUrl,
            password: env.redisPassword,
            username: env.redisUsername,
            ttl: env.redisTTL
        },
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        }

    }));
}

export interface DiscordMessageCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
        readonly ttl: number;
    };
}
