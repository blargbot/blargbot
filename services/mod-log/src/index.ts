import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { ModLogMessageBroker } from '@blargbot/mod-log-client';
import { Sequelize, sequelizeToService } from '@blargbot/sequelize';

import ModLogSequelizeDatabase from './ModLogSequelizeDatabase.js';
import { ModLogService } from './ModLogService.js';

@hostIfEntrypoint(() => [{
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
export class ModLogApplication extends ServiceHost {
    public constructor(options: ModLogApplicationOptions) {
        const serviceName = 'mod-log';
        const database = new Sequelize(
            options.postgres.database,
            options.postgres.user,
            options.postgres.pass,
            {
                ...options.postgres.sequelize,
                dialect: 'postgres'
            }
        );
        const hub = new MessageHub(options.messages);
        const modLog = new ModLogMessageBroker(hub, serviceName);
        const service = new ModLogService(new ModLogSequelizeDatabase(database), modLog);

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                sequelizeToService(database, {
                    syncOptions: { alter: true }
                }),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => modLog.handleCreateModLog(m => service.createModLog(m)), 'handleCreateModLog'),
                connectToService(() => modLog.handleDeleteModLog(m => service.deleteModLog(m)), 'handleDeleteModLog'),
                connectToService(() => modLog.handleUpdateModLog(m => service.updateModLog(m)), 'handleUpdateModLog')
            )
        ]);
    }
}

export interface ModLogApplicationOptions {
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
