import pg from 'pg';
import sequelize from 'sequelize';
import { sleep } from '../../utils';
import { models } from './postgresModels';
import { PostgresDbOptions } from '../types';
import { Logger } from '../../Logger';

delete (<Record<string, unknown>>pg).native; // TODO Do we need to do this?

type PostgresModels = {
    [P in keyof typeof models]: ReturnType<typeof models[P]>
};

export class PostgresDb {
    public readonly sequelize: sequelize.Sequelize;
    public readonly models: PostgresModels;

    public constructor(
        public readonly logger: Logger,
        options: PostgresDbOptions
    ) {
        this.sequelize = new sequelize.Sequelize(
            options.database,
            options.user,
            options.pass,
            {
                operatorsAliases: false,
                host: options.host,
                dialect: 'postgres',
                logging: this.logger.database,
                ...options.sequelize
            }
        );
        this.models = {
            bbtagVariables: models.bbtagVariables(this.sequelize, this.logger)
        };
    }

    public async authenticate(): Promise<void> {
        try {
            await this.sequelize.authenticate();
            this.logger.init('Connected to postgres. Loading models...');
            await this.loadModels();
        } catch (err: unknown) {
            this.logger.error('Failed to connect to postgres, retrying in 5 seconds', err);
            await sleep(5 * 1000);
            return await this.authenticate();
        }
    }

    private async loadModels(): Promise<void> {
        for (const model of Object.values(this.models))
            await model.sync();
        this.logger.init('Database models loaded.');
    }
}
