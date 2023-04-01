import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { ModLogMessageBroker } from '@blargbot/mod-log-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createModLogRequestHandler } from './createUserWarningRequestHandler.js';
import UserWarningSequelizeDatabase from './UserWarningSequelizeDatabase.js';
import { UserWarningService } from './UserWarningService.js';

export class UserWarningsApplication extends ServiceHost {
    public constructor(options: UserWarningsApplicationOptions) {
        const serviceName = 'user-warnings';
        const hub = new MessageHub(options.messages);
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );

        const service = new UserWarningService(
            new ModLogMessageBroker(hub, serviceName),
            new UserWarningSequelizeDatabase(database)
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createModLogRequestHandler(service)),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new UserWarningsApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
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

export interface UserWarningsApplicationOptions {
    readonly messages: ConnectionOptions;
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
