import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { RedisKVCache } from '@blargbot/redis-cache';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createGuildCacheRequestHandler } from './createGuildCacheRequestHandler.js';
import type { DiscordGuildCacheMessageBrokerOptions } from './DiscordGuildCacheMessageBroker.js';
import { DiscordGuildCacheMessageBroker } from './DiscordGuildCacheMessageBroker.js';
import { DiscordGuildCacheService } from './DiscordGuildCacheService.js';
import type { SlimDiscordGuild } from './SlimDiscordGuild.js';

@Application.hostIfEntrypoint(() => [{
    port: env.appPort,
    redis: {
        url: env.redisUrl,
        password: env.redisPassword,
        username: env.redisUsername
    },
    messages: {
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordGuildCacheApplication extends Application {
    readonly #redis: RedisClientType;
    readonly #messages: DiscordGuildCacheMessageBroker;
    readonly #service: DiscordGuildCacheService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;
    readonly #cache: RedisKVCache<bigint, SlimDiscordGuild>;

    public constructor(options: DiscordChatlogApplicationOptions) {
        super();

        this.#port = options.port;
        this.#redis = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        this.#cache = new RedisKVCache<bigint, SlimDiscordGuild>(this.#redis, {
            ttlS: null,
            keyspace: 'discord_guilds'
        });
        this.#messages = new DiscordGuildCacheMessageBroker(options.messages);
        this.#service = new DiscordGuildCacheService(this.#messages, this.#cache);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createGuildCacheRequestHandler(this.#service));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected override async start(): Promise<void> {
        await Promise.all([
            this.#redis.connect().then(() => console.log('Redis connected')),
            await this.#messages.connect().then(() => console.log('Message bus connected'))
        ]);
        await this.#service.start();
        await new Promise<void>(res => this.#server.listen(this.#port, res));
    }

    protected override async stop(): Promise<void> {
        await new Promise<void>((res, rej) => this.#server.close(err => err === undefined ? res() : rej(err)));
        await this.#service.stop();
        await Promise.all([
            this.#redis.disconnect().then(() => console.log('Redis disconnected')),
            await this.#messages.disconnect().then(() => console.log('Message bus disconnected'))
        ]);
    }
}

export interface DiscordChatlogApplicationOptions {
    readonly port: number;
    readonly messages: DiscordGuildCacheMessageBrokerOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
