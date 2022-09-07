import { CreationAttributes, FindOptions, Model, ModelAttributes, ModelStatic } from 'sequelize';

import { PostgresDb } from '../clients';

export class PostgresDbTable<T extends object> {
    readonly #model: ModelStatic<Model<T>>;

    public constructor(postgres: PostgresDb, modelName: string, attributes: ModelAttributes<Model<T>>) {
        this.#model = postgres.defineModel(modelName, attributes);
    }

    public async get(filter: FindOptions<T>): Promise<T | undefined> {
        const model = await this.#model.findOne(filter);
        return model?.get();
    }

    public async destroy(filter: FindOptions<T>): Promise<void> {
        await this.#model.destroy(filter);
    }

    public async upsert(value: CreationAttributes<Model<T, T>>): Promise<void> {
        await this.#model.upsert(value);
    }
}
