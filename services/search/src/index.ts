import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { SearchMessageBroker } from '@blargbot/search-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import { createSearchRequestHandler } from './createSearchRequestHandler.js';
import { SearchDatabase } from './SearchDatabase.js';
import { SearchService } from './SearchService.js';

export class SearchApplication extends ServiceHost {
    public constructor(options: SearchApplicationOptions) {
        const serviceName = 'search';
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

        const messages = new SearchMessageBroker(hub, serviceName);
        const service = new SearchService(
            new SearchDatabase(database)
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => messages.handleSearchTermDelete(d => service.delete(d)), 'handleSearchTermDelete'),
                connectToService(() => messages.handleSearchTermSet(d => service.set(d)), 'handleSearchTermSet')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createSearchRequestHandler(service)),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new SearchApplication({
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

export interface SearchApplicationOptions {
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
