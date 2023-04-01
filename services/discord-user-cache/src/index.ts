import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createUserCacheRequestHandler } from './createUserCacheRequestHandler.js';
import { DiscordUserCacheService } from './DiscordUserCacheService.js';

export class DiscordUserCacheApplication extends ServiceHost {
    public constructor(options: DiscordUserCacheApplicationOptions) {
        const serviceName = 'discord-user-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordUserCacheService(
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
            parallelServices(
                connectToService(redis, 'redis'),
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => gateway.handleGuildCreate(m => service.handleGuildCreate(m)), 'handleGuildCreate'),
                connectToService(() => gateway.handleGuildMemberAdd(m => service.handleGuildMemberAdd(m)), 'handleGuildMemberAdd'),
                connectToService(() => gateway.handleGuildMembersChunk(m => service.handleGuildMembersChunk(m)), 'handleGuildMembersChunk'),
                connectToService(() => gateway.handleUserUpdate(m => service.handleUserUpdate(m)), 'handleUserUpdate'),
                connectToService(() => gateway.handleReady(m => service.handleReady(m)), 'handleReady'),
                connectToService(() => gateway.handleGuildBanAdd(m => service.handleGuildBanAdd(m)), 'handleGuildBanAdd'),
                connectToService(() => gateway.handleGuildBanRemove(m => service.handleGuildBanRemove(m)), 'handleGuildBanRemove'),
                connectToService(() => gateway.handleInteractionCreate(m => service.handleInteractionCreate(m)), 'handleInteractionCreate')
            ),
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

if (isEntrypoint()) {
    host(new DiscordUserCacheApplication({
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

export interface DiscordUserCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
