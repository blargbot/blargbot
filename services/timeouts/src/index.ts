import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';
import { TimeoutClockMessageBroker } from '@blargbot/timeout-clock-client';

import { createTimeoutRequestHandler } from './createTimeoutRequestHandler.js';
import { TimeoutMessageBroker } from './TimeoutMessageBroker.js';
import TimeoutSequelizeDatabase from './TimeoutSequelizeDatabase.js';
import { TimeoutService } from './TimeoutService.js';

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
        const serviceName = 'timeouts';
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
        const clock = new TimeoutClockMessageBroker(hub, serviceName);
        const timeouts = new TimeoutMessageBroker(hub);
        const service = new TimeoutService(
            new TimeoutSequelizeDatabase(database),
            timeouts,
            hub
        );

        super([
            parallelServices(
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => clock.handleTick(() => service.handleTick()), 'handleTick'),
                connectToService(() => timeouts.handleProcessTimeout(m => service.handleProcessTimeout(m)), 'handleProcessTimeout')
            ),
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
