import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { Sequelize } from '@blargbot/sequelize';

import { createModLogRequestHandler } from './createModLogRequestHandler.js';
import type { ModLogEntry } from './ModLogEntry.js';
import { modLogEntrySerializer } from './ModLogEntry.js';
import ModLogSequelizeDatabase from './ModLogSequelizeDatabase.js';
import { ModLogService } from './ModLogService.js';

export type { ModLogEntry };
export { modLogEntrySerializer };

@Application.hostIfEntrypoint(() => [{
    port: env.appPort,
    postgres: {
        user: env.postgresUser,
        pass: env.postgresPassword,
        database: env.postgresDatabase,
        sequelize: {
            host: env.postgresHost
        }
    }
}])
export class ModLogApplication extends Application {
    readonly #postgres: Sequelize;
    readonly #database: ModLogSequelizeDatabase;
    readonly #service: ModLogService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: ModLogApplicationOptions) {
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

        this.#database = new ModLogSequelizeDatabase(this.#postgres);
        this.#service = new ModLogService(this.#database);

        this.#app = express()
            .use(express.urlencoded({ extended: true }))
            .use(express.json())
            .all('/*', createModLogRequestHandler(this.#service));
        this.#server = new Server(this.#app.bind(this.#app));
    }

    protected async start(): Promise<void> {
        await this.#postgres.authenticate().then(() => console.log('Postgres connected'));
        await this.#postgres.sync({ alter: true }).then(() => console.log('Database models synced'));
        await new Promise<void>(res => this.#server.listen(this.#port, res));
    }

    protected async stop(): Promise<void> {
        await new Promise<void>((res, rej) => this.#server.close(err => err === undefined ? res() : rej(err)));
        await this.#postgres.close().then(() => console.log('Postgres disconnected'));
    }
}

export interface ModLogApplicationOptions {
    readonly port: number;
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
