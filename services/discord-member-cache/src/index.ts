import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
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

export class DiscordMemberCacheApplication extends ServiceHost {
    public constructor(options: DiscordMemberCacheApplicationOptions) {
        const serviceName = 'discord-member-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordMemberCacheService(
            new RedisKKVCache<bigint, bigint, SlimDiscordMember>(redis, {
                ttlS: null,
                keyspace: 'discord_members',
                key2Reader: v => BigInt(v)
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
                connectToService(() => gateway.handleGuildMemberAdd(m => service.handleGuildMemberAdd(m)), 'handleGuildMemberAdd'),
                connectToService(() => gateway.handleGuildMemberRemove(m => service.handleGuildMemberRemove(m)), 'handleGuildMemberRemove'),
                connectToService(() => gateway.handleGuildMemberUpdate(m => service.handleGuildMemberUpdate(m)), 'handleGuildMemberUpdate'),
                connectToService(() => gateway.handleGuildMembersChunk(m => service.handleGuildMembersChunk(m)), 'handleGuildMembersChunk')
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
    host(new DiscordMemberCacheApplication({
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

export interface DiscordMemberCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
