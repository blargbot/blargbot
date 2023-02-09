import type { PostgresConfiguration } from '@blargbot/config';
import type { Logger } from '@blargbot/logger';
import type { AbstractQueryGenerator, Model, ModelAttributes, ModelStatic, Transaction } from '@blargbot/sequelize';
import { Sequelize } from '@blargbot/sequelize';

export class PostgresDb {
    readonly #sequelize: Sequelize;
    readonly #escape: AbstractQueryGenerator['escape'];

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
        const qi = this.#sequelize.getQueryInterface().queryGenerator;
        this.#escape = qi.escape.bind(qi);
    }

    public defineModel<T extends object>(name: string, attributes: ModelAttributes<Model<T>>): ModelStatic<Model<T>> {
        return this.#sequelize.define<Model<T>>(name, attributes);
    }

    public async transaction<T>(callback: (t: Transaction) => Awaitable<T>): Promise<T> {
        return await this.#sequelize.transaction(callback);
    }

    public async connect(): Promise<void> {
        await this.#sequelize.authenticate();
        this.logger.init('Connected to postgres. Loading models...');
        await this.#loadModels();
    }

    public escape(value: string): string {
        return this.#escape(value).slice(1, -1);
    }

    async #loadModels(): Promise<void> {
        for (const model of Object.values(this.#sequelize.models))
            await model.sync();
        this.logger.init('Database models loaded.');
    }
}
