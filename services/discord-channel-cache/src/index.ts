import { connectionToService, hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { RedisKSCache, RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createMemberCacheRequestHandler } from './createChannelCacheRequestHandler.js';
import { DiscordChannelCacheService } from './DiscordChannelCacheService.js';

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
export class DiscordChannelCacheApplication extends ServiceHost {
    public constructor(options: DiscordChannelCacheApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });
        const service = new DiscordChannelCacheService(
            new DiscordGatewayMessageBroker(messages, 'discord-channel-cache'),
            new RedisKVCache<bigint, Discord.APIChannel>(redis, {
                ttlS: null,
                keyspace: 'discord_channels'
            }),
            new RedisKSCache<bigint, bigint>(redis, {
                ttlS: null,
                keyspace: 'discord_channels:guild_to_channels',
                serializer: json.bigint
            }),
            new RedisKVCache<bigint, bigint>(redis, {
                ttlS: null,
                keyspace: 'discord_channels:channel_to_guild',
                serializer: json.bigint
            })
        );

        super([
            connectionToService(redis, 'redis'),
            connectionToService(messages, 'rabbitmq'),
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

export interface DiscordChannelCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
