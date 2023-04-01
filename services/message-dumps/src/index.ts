import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import express from '@blargbot/express';
import { MetricsPushService } from '@blargbot/metrics-client';

import { createMessageDumpRequestHandler } from './createMessageDumpRequestHandler.js';
import type { MessageDumpDatabaseOptions } from './MessageDumpDatabase.js';
import MessageDumpDatabase from './MessageDumpDatabase.js';
import { MessageDumpService } from './MessageDumpService.js';

@hostIfEntrypoint(() => [{
    port: env.appPort,
    database: {
        contactPoints: env.cassandraContactPoints,
        keyspace: env.cassandraKeyspace,
        username: env.cassandraUsername,
        password: env.cassandraPassword
    }
}])
export class ChatlogApplication extends ServiceHost {
    public constructor(options: ChatlogApplicationOptions) {
        const serviceName = 'chatlog';
        const database = new MessageDumpDatabase(options.database);
        super([
            parallelServices(
                connectToService(database, 'cassandra'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createMessageDumpRequestHandler(
                        new MessageDumpService(database)
                    )),
                options.port
            )
        ]);
    }
}

export interface ChatlogApplicationOptions {
    readonly port: number;
    readonly database: MessageDumpDatabaseOptions;
}
