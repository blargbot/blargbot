import { Server } from 'node:http';

import Application from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { Sequelize } from '@blargbot/sequelize';

import { createModLogRequestHandler } from './createUserWarningRequestHandler.js';
import UserWarningSequelizeDatabase from './UserWarningSequelizeDatabase.js';
import { UserWarningService } from './UserWarningService.js';

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
export class UserWarningsApplication extends Application {
    readonly #postgres: Sequelize;
    readonly #database: UserWarningSequelizeDatabase;
    readonly #service: UserWarningService;
    readonly #app: express.Express;
    readonly #server: Server;
    readonly #port: number;

    public constructor(options: UserWarningsApplicationOptions) {
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

        this.#database = new UserWarningSequelizeDatabase(this.#postgres);
        this.#service = new UserWarningService(this.#database);

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

export interface UserWarningsApplicationOptions {
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
