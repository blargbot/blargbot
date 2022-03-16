import { PostgresConfiguration } from '@blargbot/config';
import { Logger } from '@blargbot/core/Logger';
import { Sequelize, Transaction } from 'sequelize';

import { BBTagVariableModel, createBBTagVariableModel } from './postgresModels';

export class PostgresDb {
    private readonly sequelize: Sequelize;
    public readonly bbtagVariables: BBTagVariableModel;

    public constructor(
        public readonly logger: Logger,
        options: PostgresConfiguration
    ) {
        this.sequelize = new Sequelize(
            options.database,
            options.user,
            options.pass,
            {
                ...options.sequelize,
                dialect: 'postgres',
                logging: this.logger.database
            }
        );

        this.bbtagVariables = createBBTagVariableModel(this.sequelize, this.logger);
    }

    public async transaction(): Promise<Transaction> {
        return await this.sequelize.transaction();
    }

    public async connect(): Promise<void> {
        await this.sequelize.authenticate();
        this.logger.init('Connected to postgres. Loading models...');
        await this.loadModels();
    }

    private async loadModels(): Promise<void> {
        for (const model of Object.values(this.sequelize.models))
            await model.sync();
        this.logger.init('Database models loaded.');
    }
}
