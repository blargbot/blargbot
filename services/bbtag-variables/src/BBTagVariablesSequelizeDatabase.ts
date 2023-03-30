import type { BBTagVariable } from '@blargbot/bbtag-variables-client';
import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn, Op } from '@blargbot/sequelize';

import type { IBBTagVariablesDatabase } from './IBBTagVariablesDatabase.js';

export default class BBTagVariablesSequelizeDatabase implements IBBTagVariablesDatabase {
    readonly #model: ModelStatic<Model<BBTagVariable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x: Partial<BBTagVariable> = {};
        this.#model = sequelize.define<Model<BBTagVariable>>('bbtag_variables', {
            ...makeColumn('ownerId', DataTypes.BIGINT, x, { primaryKey: true, unique: 'key' }),
            ...makeColumn('scope', DataTypes.STRING, x, { primaryKey: true, unique: 'key' }),
            ...makeColumn('name', DataTypes.STRING, x, { primaryKey: true, unique: 'key' }),
            ...makeColumn('value', DataTypes.JSON, x)
        });
    }

    public async get(ownerId: bigint, scope: string, name: string): Promise<BBTagVariable | undefined> {
        const model = await this.#model.findOne({ where: { ownerId, scope, name } });
        return model?.get();
    }

    public async getAll(ownerId: bigint, scope: string, names: Iterable<string>): Promise<BBTagVariable[]> {
        const models = await this.#model.findAll({ where: { ownerId, scope, name: { [Op.in]: [...names] } } });
        return models.map(m => m.get());
    }

    public async set(ownerId: bigint, scope: string, name: string, value: JToken): Promise<void> {
        if (value === null)
            await this.#model.destroy({ where: { ownerId, scope, name } });
        else
            await this.#model.upsert({ ownerId, scope, name, value });
    }

    public async setAll(ownerId: bigint, scope: string, values: Record<string, JToken>): Promise<void> {
        const destroy = [];
        const set = [];
        for (const [key, value] of Object.entries(values)) {
            if (value === null)
                destroy.push(key);
            else
                set.push([key, value] as const);
        }

        const operations = [];
        if (destroy.length > 0)
            operations.push(this.#model.destroy({ where: { ownerId, scope, name: { [Op.in]: destroy } } }));
        if (set.length > 0)
            operations.push(...set.map(([name, value]) => this.#model.upsert({ ownerId, scope, name, value })));
        await Promise.all(operations);
    }

    public async clear(ownerId: bigint, scope?: string): Promise<void> {
        await this.#model.destroy({ where: { ownerId, scope } });
    }

}
