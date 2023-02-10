import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { IUserWarningDatabase } from './IUserWarningDatabase.js';

interface UserWarningsTable {
    readonly guildId: bigint;
    readonly userId: bigint;
    readonly count: number;
}

export default class UserWarningSequelizeDatabase implements IUserWarningDatabase {
    readonly #userWarnings: ModelStatic<Model<UserWarningsTable>>;
    readonly #sequelize: Pick<Sequelize, 'transaction'>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        this.#sequelize = sequelize;
        const x = defaultUserWarnings;
        this.#userWarnings = sequelize.define<Model<UserWarningsTable>>('user_warnings', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('userId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('count', DataTypes.INTEGER, x)
        }, {
            indexes: [
                {
                    fields: ['guildId', 'userId'],
                    unique: true
                }
            ]
        });
    }

    public async get(guildId: bigint, userId: bigint): Promise<number> {
        const model = await this.#userWarnings.findOne({ where: { userId, guildId } });
        return model?.get().count ?? 0;
    }

    public async add(guildId: bigint, userId: bigint, count: number): Promise<{ oldCount: number; newCount: number; }> {
        return await this.#sequelize.transaction(async () => {
            const [model] = await this.#userWarnings.findOrCreate({ where: { userId, guildId }, defaults: { userId, guildId, count: 0 } });
            const oldCount = model.get().count;
            let newCount = oldCount + count;
            if (newCount < min)
                newCount = min;
            if (newCount > max)
                newCount = max;
            await model.update({ count: newCount });
            return { oldCount, newCount };
        });
    }

    public async clear(guildId: bigint, userId?: bigint | undefined): Promise<void> {
        await this.#userWarnings.destroy({ where: { guildId, userId } });
    }

}

const defaultUserWarnings: { [P in keyof Required<UserWarningsTable>]: UserWarningsTable[P] | undefined } = {
    guildId: undefined,
    userId: undefined,
    count: 0
};

const max = ~(1 << 31);
const min = 0;
