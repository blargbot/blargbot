import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-broker';
import { Sequelize } from '@blargbot/sequelize';

import { createTimeoutRequestHandler } from './createTimeoutRequestHandler.js';
import type { TimeoutRecord } from './TimeoutDetails.js';
import { timeoutRecordSerializer } from './TimeoutDetails.js';
import { TimeoutMessageBroker } from './TimeoutMessageBroker.js';
import TimeoutSequelizeDatabase from './TimeoutSequelizeDatabase.js';
import { TimeoutService } from './TimeoutService.js';

export type { TimeoutRecord as GuildSettings };
export { timeoutRecordSerializer as timeoutSerializer };

@Application.hostIfEntrypoint(() => [{
    port: env.appPort,
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
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
    readonly #postgres: Sequelize;
    readonly #database: TimeoutSequelizeDatabase;
    readonly #messages: TimeoutMessageBroker;
    readonly #service: TimeoutService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: GuildSettingsApplicationOptions) {
        super();

        this.#port = options.port;
        this.#postgres = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );

        this.#database = new TimeoutSequelizeDatabase(this.#postgres);
        this.#messages = new TimeoutMessageBroker(options.messages);
        this.#service = new TimeoutService(this.#database, this.#messages);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createTimeoutRequestHandler(this.#service));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected async start(): Promise<void> {
        await Promise.all([
            this.#messages.connect().then(() => console.log('Messages connected')),
            this.#postgres.authenticate().then(() => console.log('Postgres connected'))
        ]);
        await this.#postgres.sync({ alter: true }).then(() => console.log('Database models synced'));
        await this.#service.start();
        await new Promise<void>(res => this.#server.listen(this.#port, res));
    }

    protected async stop(): Promise<void> {
        await new Promise<void>((res, rej) => this.#server.close(err => err === undefined ? res() : rej(err)));
        await this.#service.stop();
        await Promise.all([
            this.#messages.disconnect().then(() => console.log('Messages disconnected')),
            this.#postgres.close().then(() => console.log('Postgres disconnected'))
        ]);
    }
}

export interface GuildSettingsApplicationOptions {
    readonly port: number;
    readonly messages: ConnectionOptions;
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
