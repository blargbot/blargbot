import { connectionToService, hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createUserCacheRequestHandler } from './createUserCacheRequestHandler.js';
import { DiscordUserCacheService } from './DiscordUserCacheService.js';

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
export class DiscordUserCacheApplication extends ServiceHost {
    public constructor(options: DiscordUserCacheApplicationOptions) {
        const serviceName = 'discord-user-cache';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const service = new DiscordUserCacheService(
            new DiscordGatewayMessageBroker(messages, serviceName),
            new RedisKVCache<bigint, Discord.APIUser>(redis, {
                ttlS: null,
                keyspace: 'discord_users',
                lockRetryMs: 1
            }),
            new RedisKVCache<'@self', bigint>(redis, {
                ttlS: null,
                keyspace: 'discord_self',
                serializer: json.bigint
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
                    .all('/*', createUserCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface DiscordUserCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
