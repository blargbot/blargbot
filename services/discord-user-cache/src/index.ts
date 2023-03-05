import { Server } from 'node:http';

import Application from '@blargbot/application';
import type Discord from '@blargbot/discord-types';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-broker';
import { RedisKVCache } from '@blargbot/redis-cache';
import { json } from '@blargbot/serialization';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createUserCacheRequestHandler } from './createUserCacheRequestHandler.js';
import { DiscordUserCacheMessageBroker } from './DiscordUserCacheMessageBroker.js';
import { DiscordUserCacheService } from './DiscordUserCacheService.js';

@Application.hostIfEntrypoint(() => [{
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
export class DiscordUserCacheApplication extends Application {
    readonly #redis: RedisClientType;
    readonly #messages: DiscordUserCacheMessageBroker;
    readonly #service: DiscordUserCacheService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: DiscordUserCacheApplicationOptions) {
        super();

        this.#port = options.port;
        this.#redis = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });

        this.#messages = new DiscordUserCacheMessageBroker(options.messages);
        this.#service = new DiscordUserCacheService(this.#messages,
            new RedisKVCache<bigint, Discord.APIUser>(this.#redis, {
                ttlS: null,
                keyspace: 'discord_users',
                lockRetryMs: 1
            }),
            new RedisKVCache<'@self', bigint>(this.#redis, {
                ttlS: null,
                keyspace: 'discord_self',
                serializer: json.bigint
            })
        );

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createUserCacheRequestHandler(this.#service));
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

export interface DiscordUserCacheApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
    };
}
