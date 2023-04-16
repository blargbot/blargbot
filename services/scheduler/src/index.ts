import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { SchedulerClockMessageBroker } from '@blargbot/scheduler-clock-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createSchedulerRequestHandler } from './createSchedulerRequestHandler.js';
import SchedulerSequelizeDatabase from './SchedulerDatabase.js';
import { SchedulerMessageBroker } from './SchedulerMessageBroker.js';
import { SchedulerService } from './SchedulerService.js';

export class SchedulerApplication extends ServiceHost {
    public constructor(options: SchedulerApplicationOptions) {
        const serviceName = 'scheduler';
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
        const clock = new SchedulerClockMessageBroker(hub, serviceName);
        const scheduler = new SchedulerMessageBroker(hub);
        const service = new SchedulerService(
            new SchedulerSequelizeDatabase(database),
            scheduler,
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
                connectToService(() => scheduler.processScheduledMessage(m => service.handleProcessTimeout(m)), 'handleProcessTimeout')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createSchedulerRequestHandler(service)),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new SchedulerApplication({
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
    }));
}

export interface SchedulerApplicationOptions {
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
