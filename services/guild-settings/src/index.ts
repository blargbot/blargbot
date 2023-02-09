import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import { RedisCache } from '@blargbot/redis-cache';
import { Sequelize } from '@blargbot/sequelize';
import express from 'express';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createGuildSettingsRequestHandler } from './createGuildSettingsRequestHandler.js';
import type { GuildSettings } from './GuildSettings.js';
import { guildSerializer } from './GuildSettings.js';
import GuildSettingsSequelizeDatabase from './GuildSettingsSequelizeDatabase.js';
import { GuildSettingsService } from './GuildSettingsService.js';

export type { GuildSettings };
export { guildSerializer };

@Application.hostIfEntrypoint(() => [{
    port: env.appPort,
    redis: {
        url: env.redisUrl,
        password: env.redisPassword,
        username: env.redisUsername,
        ttl: env.redisTTL
    },
    postgres: {
        user: env.postgresUser,
        pass: env.postgresPassword,
        database: env.postgresDatabase,
        sequelize: {
            host: env.postgresHost
        }
    }
}])
export class GuildSettingsApplication extends Application {
    readonly #redis: RedisClientType;
    readonly #postgres: Sequelize;
    readonly #cache: RedisCache<bigint, GuildSettings>;
    readonly #database: GuildSettingsSequelizeDatabase;
    readonly #service: GuildSettingsService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: GuildSettingsApplicationOptions) {
        super();

        this.#port = options.port;
        this.#redis = createRedisClient({
            url: options.redis.url,
            username: options.redis.username,
            password: options.redis.password
        });
        this.#postgres = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );

        this.#cache = new RedisCache<bigint, GuildSettings>(this.#redis, {
            ttlS: options.redis.ttl,
            keyFactory: guildId => `guild_settings:${guildId}`,
            serializer: guildSerializer
        });
        this.#database = new GuildSettingsSequelizeDatabase(this.#postgres);
        this.#service = new GuildSettingsService(this.#database, this.#cache);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/:guildId', createGuildSettingsRequestHandler(this.#service));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected async start(): Promise<void> {
        await Promise.all([
            this.#redis.connect().then(() => console.log('Redis connected')),
            this.#postgres.authenticate().then(() => console.log('Postgres connected'))
        ]);
        await this.#database.sync();
        await new Promise<void>(res => this.#server.listen(this.#port, res));
    }

    protected async stop(): Promise<void> {
        await new Promise<void>((res, rej) => this.#server.close(err => err === undefined ? res() : rej(err)));
        await Promise.all([
            this.#redis.disconnect().then(() => console.log('Redis disconnected')),
            this.#postgres.close().then(() => console.log('Postgres disconnected'))
        ]);
    }
}

export interface GuildSettingsApplicationOptions {
    readonly port: number;
    readonly redis: {
        readonly url: string;
        readonly password: string;
        readonly username: string;
        readonly ttl: number;
    };
    readonly postgres: {
        readonly user: string;
        readonly pass: string;
        readonly database: string;
        readonly sequelize: {
            readonly host?: string;
            readonly pool?: {
                readonly max: number;
                readonly min: number;
                readonly acquire: number;
                readonly idle: number;
            };
        };
    };
}
