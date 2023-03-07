import { hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createModLogRequestHandler } from './createUserWarningRequestHandler.js';
import UserWarningSequelizeDatabase from './UserWarningSequelizeDatabase.js';
import { UserWarningService } from './UserWarningService.js';

@hostIfEntrypoint(() => [{
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
export class UserWarningsApplication extends ServiceHost {
    public constructor(options: UserWarningsApplicationOptions) {
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );

        super([
            sequelizeToService(database, {
                syncOptions: { alter: true }
            }),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createModLogRequestHandler(new UserWarningService(new UserWarningSequelizeDatabase(database)))),
                options.port
            )
        ]);
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
