import { hostIfEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import BBTagVariablesSequelizeDatabase from './BBTagVariablesSequelizeDatabase.js';
import { BBTagVariablesService } from './BBTagVariablesService.js';
import { createBBTagVariablesRequestHandler } from './createBBTagVariablesRequestHandler.js';

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
export class BBTagVariablesApplication extends ServiceHost {
    public constructor(options: BBTagVariablesApplicationOptions) {
        const serviceName = 'user-settings';
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
            parallelServices(
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createBBTagVariablesRequestHandler(new BBTagVariablesService(
                        new BBTagVariablesSequelizeDatabase(database)
                    ))),
                options.port
            )
        ]);
    }
}

export interface BBTagVariablesApplicationOptions {
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
