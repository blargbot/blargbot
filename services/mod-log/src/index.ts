import { hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createModLogRequestHandler } from './createModLogRequestHandler.js';
import type { ModLogEntry } from './ModLogEntry.js';
import { modLogEntrySerializer } from './ModLogEntry.js';
import ModLogSequelizeDatabase from './ModLogSequelizeDatabase.js';
import { ModLogService } from './ModLogService.js';

export type { ModLogEntry };
export { modLogEntrySerializer };

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
export class ModLogApplication extends ServiceHost {
    public constructor(options: ModLogApplicationOptions) {
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
                    .all('/*', createModLogRequestHandler(new ModLogService(new ModLogSequelizeDatabase(database)))),
                options.port
            )
        ]);
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
