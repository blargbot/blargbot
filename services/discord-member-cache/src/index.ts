import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { RedisKKVCache } from '@blargbot/redis-cache';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createMemberCacheRequestHandler } from './createMemberCacheRequestHandler.js';
import type { DiscordMemberCacheMessageBrokerOptions } from './DiscordMemberCacheMessageBroker.js';
import { DiscordMemberCacheMessageBroker } from './DiscordMemberCacheMessageBroker.js';
import { DiscordMemberCacheService } from './DiscordMemberCacheService.js';
import type { SlimDiscordMember } from './SlimDiscordMember.js';

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
    readonly #messages: DiscordMemberCacheMessageBroker;
    readonly #service: DiscordMemberCacheService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;
    readonly #cache: RedisKKVCache<bigint, bigint, SlimDiscordMember>;

    public constructor(options: DiscordChatlogApplicationOptions) {
        super();

        this.#port = options.port;
        this.#redis = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        this.#cache = new RedisKKVCache<bigint, bigint, SlimDiscordMember>(this.#redis, {
            ttlS: null,
            keyspace: 'discord_members',
            key2Reader: v => BigInt(v)
        });
        this.#messages = new DiscordMemberCacheMessageBroker(options.messages);
        this.#service = new DiscordMemberCacheService(this.#messages, this.#cache);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createMemberCacheRequestHandler(this.#service));
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
    readonly messages: DiscordMemberCacheMessageBrokerOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
