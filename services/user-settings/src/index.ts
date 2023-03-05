import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { RedisKVCache } from '@blargbot/redis-cache';
import { Sequelize } from '@blargbot/sequelize';
import type { UserSettings } from '@blargbot/user-settings-contract';
import userSettings from '@blargbot/user-settings-contract';
import type { RedisClientType } from 'redis';
import { createClient as createRedisClient } from 'redis';

import { createUserSettingsRequestHandler } from './createUserSettingsRequestHandler.js';
import UserSettingsSequelizeDatabase from './UserSettingsSequelizeDatabase.js';
import { UserSettingsService } from './UserSettingsService.js';

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
export class UserSettingsApplication extends Application {
    readonly #redis: RedisClientType;
    readonly #postgres: Sequelize;
    readonly #cache: RedisKVCache<bigint, UserSettings>;
    readonly #database: UserSettingsSequelizeDatabase;
    readonly #service: UserSettingsService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: UserSettingsApplicationOptions) {
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

        this.#cache = new RedisKVCache<bigint, UserSettings>(this.#redis, {
            ttlS: options.redis.ttl,
            keyspace: 'user_settings',
            serializer: userSettings
        });
        this.#database = new UserSettingsSequelizeDatabase(this.#postgres);
        this.#service = new UserSettingsService(this.#database, this.#cache);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createUserSettingsRequestHandler(this.#service));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected async start(): Promise<void> {
        await Promise.all([
            this.#redis.connect().then(() => console.log('Redis connected')),
            this.#postgres.authenticate().then(() => console.log('Postgres connected'))
        ]);
        await this.#postgres.sync({ alter: true }).then(() => console.log('Database models synced'));
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

export interface UserSettingsApplicationOptions {
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
