import type { ScheduledMessage } from '@blargbot/scheduler-client';
import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { col, DataTypes, fn, makeColumn, Op, where } from '@blargbot/sequelize';
import { randomBytes } from 'crypto';

import type { ISchedulerRecordDatabase } from './ISchedulerRecordDatabase.js';

interface ScheduledMessageTable extends Omit<ScheduledMessage, 'data'> {
    readonly data: Buffer;
    readonly dataType: string;
}

export default class SchedulerSequelizeDatabase implements ISchedulerRecordDatabase {
    readonly #model: ModelStatic<Model<ScheduledMessageTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x: Partial<ScheduledMessageTable> = {};
        this.#model = sequelize.define<Model<ScheduledMessageTable>>('scheduled_messages', {
            ...makeColumn('id', DataTypes.STRING, x, { primaryKey: true, unique: true }),
            ...makeColumn('ownerId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('data', DataTypes.BLOB, x),
            ...makeColumn('dataType', DataTypes.STRING, x),
            ...makeColumn('display', DataTypes.TEXT, x),
            ...makeColumn('end', DataTypes.DATE, x),
            ...makeColumn('options', DataTypes.STRING, x, {
                get() {
                    return JSON.parse(this.getDataValue('options') as never);
                },
                set(v) {
                    this.setDataValue('options', JSON.stringify(v) as never);
                }
            }),
            ...makeColumn('queue', DataTypes.STRING, x),
            ...makeColumn('start', DataTypes.DATE, x),
            ...makeColumn('userId', DataTypes.BIGINT, x)
        });
    }

    public async create(record: Omit<ScheduledMessage, 'id'>): Promise<string> {
        const model = await this.#model.create({
            ...record,
            data: Buffer.from(await record.data.arrayBuffer()),
            dataType: record.data.type,
            id: randomBytes(8).toString('hex')
        });
        return model.get().id;
    }

    #toResult(model: ScheduledMessageTable): ScheduledMessage
    #toResult(model?: ScheduledMessageTable): ScheduledMessage | undefined
    #toResult(model?: ScheduledMessageTable): ScheduledMessage | undefined {
        if (model === undefined)
            return undefined;
        return {
            ...model,
            data: new Blob([model.data], { type: model.dataType })
        };
    }

    public async get(ownerId: bigint, id: string): Promise<ScheduledMessage | undefined> {
        const model = await this.#model.findOne({ where: { ownerId, id } });
        return this.#toResult(model?.get());
    }

    public async list(ownerId: bigint, offset: number, count: number): Promise<ScheduledMessage[]> {
        const models = await this.#model.findAll({
            where: { ownerId },
            order: [
                ['end', 'ASC']
            ],
            offset,
            limit: count
        });
        return models.map(m => this.#toResult(m.get()));
    }

    public async count(ownerId: bigint): Promise<number> {
        return await this.#model.count({ where: { ownerId } });
    }

    public async delete(ownerId: bigint, id: string): Promise<void> {
        await this.#model.destroy({ where: { id, ownerId } });
    }

    public async deleteAll(records: Iterable<{ ownerId: bigint; id: string; }>): Promise<void> {
        await this.#model.destroy({
            where: where(fn('concat', col('ownerId'), '|', col('id')), {
                [Op.in]: Array.from(records, x => `${x.ownerId}|${x.id}`)
            })
        });
    }

    public async clear(ownerId: bigint): Promise<void> {
        await this.#model.destroy({ where: { ownerId } });
    }

    public async pending(): Promise<ScheduledMessage[]> {
        const models = await this.#model.findAll({ where: { end: { [Op.lte]: new Date() } } });
        return models.map(m => this.#toResult(m.get()));
    }

}
