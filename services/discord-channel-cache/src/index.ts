import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKSCache, RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createMemberCacheRequestHandler } from './createChannelCacheRequestHandler.js';
import { DiscordChannelCacheService } from './DiscordChannelCacheService.js';

export class DiscordChannelCacheApplication extends ServiceHost {
    public constructor(options: DiscordChannelCacheApplicationOptions) {
        const serviceName = 'discord-channel-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordChannelCacheService(
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
            parallelServices(
                connectToService(redis, 'redis'),
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => gateway.handleGuildCreate(m => service.handleGuildCreate(m)), 'handleGuildCreate'),
                connectToService(() => gateway.handleGuildDelete(m => service.handleGuildDelete(m)), 'handleGuildDelete'),
                connectToService(() => gateway.handleChannelCreate(m => service.handleChannelCreate(m)), 'handleChannelCreate'),
                connectToService(() => gateway.handleChannelDelete(m => service.handleChannelDelete(m)), 'handleChannelDelete'),
                connectToService(() => gateway.handleChannelUpdate(m => service.handleChannelUpdate(m)), 'handleChannelUpdate'),
                connectToService(() => gateway.handleThreadCreate(m => service.handleThreadCreate(m)), 'handleThreadCreate'),
                connectToService(() => gateway.handleThreadDelete(m => service.handleThreadDelete(m)), 'handleThreadDelete'),
                connectToService(() => gateway.handleThreadListSync(m => service.handleThreadListSync(m)), 'handleThreadListSync'),
                connectToService(() => gateway.handleThreadUpdate(m => service.handleThreadUpdate(m)), 'handleThreadUpdate')
            ),
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

if (isEntrypoint()) {
    host(new DiscordChannelCacheApplication({
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

    }));
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
