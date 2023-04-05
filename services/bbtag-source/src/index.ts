import { host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import BBTagSourceDatabase from './BBTagSourceDatabase.js';
import { BBTagSourceService } from './BBTagSourceService.js';
import { createBBTagSourceRequestHandler } from './createBBTagSourceRequestHandler.js';

export class BBTagSourceApplication extends ServiceHost {
    public constructor(options: BBTagSourceApplicationOptions) {
        const serviceName = 'bbtag-source';
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
                    .all('/*', createBBTagSourceRequestHandler(new BBTagSourceService(
                        new BBTagSourceDatabase(database)
                    ))),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new BBTagSourceApplication({
        port: env.appPort,
        postgres: {
            user: env.postgresUser,
            pass: env.postgresPassword,
            database: env.postgresDatabase,
            sequelize: {
                host: env.postgresHost
            }
        }
    }));
}

export interface BBTagSourceApplicationOptions {
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
