import type { BBTagSource as BBTagSourceDto, BBTagSourceFilter, BBTagSourceIndex as BBTagSourceIndexDto } from '@blargbot/bbtag-source-client';
import type { Model, ModelStatic, Sequelize, Transaction } from '@blargbot/sequelize';
import { DataTypes, makeColumn, Op } from '@blargbot/sequelize';
import { randomUUID } from 'crypto';

import type { IBBTagSourceDatabase } from './IBBTagSourceDatabase.js';

interface BBTagSource extends BBTagSourceDto {
    readonly id: string;
}

interface BBTagSourceIndex {
    readonly id: string;
    readonly ownerId: bigint;
    readonly type: string;
    readonly name: string;
    readonly valueId: string | null;
}

export default class BBTagSourceDatabase implements IBBTagSourceDatabase {
    readonly #indexes: ModelStatic<Model<BBTagSourceIndex>>;
    readonly #sources: ModelStatic<Model<BBTagSource>>;
    readonly #sequelize: Pick<Sequelize, 'define' | 'transaction'>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        this.#sequelize = sequelize;
        const x: Partial<BBTagSourceIndex> = { valueId: null };
        this.#indexes = sequelize.define<Model<BBTagSourceIndex>>('bbtag_source_index', {
            ...makeColumn('id', DataTypes.UUID, x, { primaryKey: true }),
            ...makeColumn('ownerId', DataTypes.BIGINT, x, { unique: 'index' }),
            ...makeColumn('type', DataTypes.STRING, x, { unique: 'index' }),
            ...makeColumn('name', DataTypes.STRING, x, { unique: 'index' }),
            ...makeColumn('valueId', DataTypes.UUID, x)
        });
        const y: Partial<BBTagSource> = {};
        this.#sources = sequelize.define<Model<BBTagSource>>('bbtag_source', {
            ...makeColumn('id', DataTypes.UUID, y, { primaryKey: true }),
            ...makeColumn('value', DataTypes.TEXT, y),
            ...makeColumn('cooldown', DataTypes.INTEGER, y)
        });

        this.#indexes.belongsTo(this.#sources, {
            as: 'value',
            foreignKey: 'valueId',
            targetKey: 'id',
            inverse: { type: 'hasMany', as: 'aliases' }
        });

        this.#sources.belongsTo(this.#indexes, {
            as: 'owner',
            foreignKey: 'id',
            targetKey: 'ownerId',
            inverse: { type: 'hasOne', as: 'owns' }
        });
    }

    public async alias(alias: BBTagSourceIndexDto, source: BBTagSourceIndexDto): Promise<void> {
        await this.#sequelize.transaction(t => this.#alias(alias, source, t));
    }

    async #alias(alias: BBTagSourceIndexDto, source: BBTagSourceIndexDto, transaction: Transaction): Promise<void> {
        const target = await this.#findSource(source, transaction);
        if (target === null)
            return;

        const { id: valueId } = target.get();
        await this.#delete(alias, transaction);
        await this.#indexes.create({ ...alias, id: randomUUID(), valueId }, { transaction });
    }

    async #findSource(index: BBTagSourceIndexDto, transaction?: Transaction): Promise<Model<BBTagSource> | null> {
        return await this.#sources.findOne({ include: { model: this.#indexes, association: 'aliases', where: { ...index } }, transaction });
    }

    public async get(index: BBTagSourceIndexDto): Promise<BBTagSourceDto | undefined> {
        const model = await this.#findSource(index);
        return model?.get();
    }

    public async set(key: BBTagSourceIndexDto, source: Partial<BBTagSourceDto>): Promise<boolean> {
        return await this.#sequelize.transaction(async t => {
            const result = await this.#set(key, source, t);
            if (!result)
                await t.rollback();
            return result;
        });
    }

    async #set(key: BBTagSourceIndexDto, source: Partial<BBTagSourceDto>, transaction: Transaction): Promise<boolean> {
        let index = await this.#indexes.findOne({ where: { ...key }, transaction });
        if (index === null) {
            if (source.value === undefined)
                return false;
            index = await this.#indexes.create({ ...key, id: randomUUID() }, { transaction });
        }
        const id = index.get().id;
        const [updated] = await this.#sources.update({ ...source }, { where: { id } });
        if (updated === 0) {
            if (source.value === undefined)
                return false;
            await this.#sources.create({ value: '', cooldown: 0, ...source, id }, { transaction });
        }
        if (index.get().valueId !== id)
            await index.update({ valueId: id }, { transaction });
        return true;
    }

    public async delete(filter: BBTagSourceFilter): Promise<void> {
        await this.#sequelize.transaction(t => this.#delete(filter, t));
    }

    async #delete(filter: BBTagSourceFilter, transaction: Transaction): Promise<void> {
        const toDestroy = await this.#indexes.findAll({ where: { ...filter }, transaction });
        await Promise.all(toDestroy.map(m => m.destroy()));
        const values = toDestroy.map(d => d.get()).filter(d => d.id === d.valueId).map(d => d.id);
        await this.#sources.destroy({ where: { id: { [Op.in]: values } }, transaction });
    }
}
