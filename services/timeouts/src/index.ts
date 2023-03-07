import { connectionToService, hostIfEntrypoint, ServiceHost, webService } from '@blargbot/application';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createTimeoutRequestHandler } from './createTimeoutRequestHandler.js';
import type { TimeoutRecord } from './TimeoutDetails.js';
import { timeoutRecordSerializer } from './TimeoutDetails.js';
import { TimeoutMessageBroker } from './TimeoutMessageBroker.js';
import TimeoutSequelizeDatabase from './TimeoutSequelizeDatabase.js';
import { TimeoutService } from './TimeoutService.js';

export type { TimeoutRecord as GuildSettings };
export { timeoutRecordSerializer as timeoutSerializer };

@hostIfEntrypoint(() => [{
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
export class GuildSettingsApplication extends ServiceHost {
    public constructor(options: GuildSettingsApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );
        const service = new TimeoutService(
            new TimeoutSequelizeDatabase(database),
            new TimeoutMessageBroker(messages)
        );

        super([
            sequelizeToService(database, {
                syncOptions: { alter: true }
            }),
            connectionToService(messages, 'rabbitmq'),
            service,
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createTimeoutRequestHandler(service)),
                options.port
            )
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
