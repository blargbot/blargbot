import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { RedisKKVCache } from '@blargbot/redis-cache';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createRoleCacheRequestHandler } from './createRoleCacheRequestHandler.js';
import { DiscordRoleCacheService } from './DiscordRoleCacheService.js';

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
export class DiscordRoleCacheApplication extends ServiceHost {
    public constructor(options: DiscordRoleCacheApplicationOptions) {
        const serviceName = 'discord-role-cache';
        const hub = new MessageHub(options.messages);
        const redis: RedisClientType = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordRoleCacheService(
            new RedisKKVCache<bigint, bigint, Discord.APIRole>(redis, {
                ttlS: null,
                keyspace: 'discord_roles',
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
                connectToService(() => gateway.handleGuildRoleCreate(m => service.handleGuildRoleCreate(m)), 'handleGuildRoleCreate'),
                connectToService(() => gateway.handleGuildRoleUpdate(m => service.handleGuildRoleUpdate(m)), 'handleGuildRoleUpdate'),
                connectToService(() => gateway.handleGuildRoleDelete(m => service.handleGuildRoleDelete(m)), 'handleGuildRoleDelete')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createRoleCacheRequestHandler(service)),
                options.port
            )
        ]);
    }
}

export interface DiscordRoleCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
