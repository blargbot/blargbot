import { PostgresConfiguration } from '@blargbot/config';
import { Logger } from '@blargbot/logger';
import { Model, ModelAttributes, ModelStatic, Sequelize, Transaction } from 'sequelize';

export class PostgresDb {
    readonly #sequelize: Sequelize;

    public constructor(
        public readonly logger: Logger,
        options: PostgresConfiguration
    ) {
        this.#sequelize = new Sequelize(
            options.database,
            options.user,
            options.pass,
            {
                ...options.sequelize,
                dialect: 'postgres',
                logging: this.logger.database
            }
        );
    }

    public defineModel<T extends object>(name: string, attributes: ModelAttributes<Model<T>>): ModelStatic<Model<T>> {
        return this.#sequelize.define<Model<T>>(name, attributes);
    }

    public async transaction(): Promise<Transaction> {
        return await this.#sequelize.transaction();
    }

    public async connect(): Promise<void> {
        await this.#sequelize.authenticate();
        this.logger.init('Connected to postgres. Loading models...');
        await this.loadModels();
    }

    private async loadModels(): Promise<void> {
        for (const model of Object.values(this.#sequelize.models))
            await model.sync();
        this.logger.init('Database models loaded.');
    }
}
