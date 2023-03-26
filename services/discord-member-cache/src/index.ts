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

import { createMemberCacheRequestHandler } from './createMemberCacheRequestHandler.js';
import { DiscordMemberCacheService } from './DiscordMemberCacheService.js';
import type { SlimDiscordMember } from './SlimDiscordMember.js';

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
export class DiscordMemberCacheApplication extends ServiceHost {
    public constructor(options: DiscordMemberCacheApplicationOptions) {
        const serviceName = 'discord-member-cache';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const service = new DiscordMemberCacheService(
            new DiscordGatewayMessageBroker(messages, serviceName),
            new RedisKKVCache<bigint, bigint, SlimDiscordMember>(redis, {
                ttlS: null,
                keyspace: 'discord_members',
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
                    .all('/*', createMemberCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface DiscordMemberCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
