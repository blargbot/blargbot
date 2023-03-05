import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';
import type { UserSettings } from '@blargbot/user-settings-contract';

import { defaultSettings } from './defaultSettings.js';
import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';

interface UserSettingsTable extends UserSettings {
    readonly userId: bigint;
}

export default class UserSettingsSequelizeDatabase implements IUserSettingsDatabase {
    readonly #model: ModelStatic<Model<UserSettingsTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x = {
            ...defaultSettings(),
            userId: undefined as bigint | undefined
        };
        this.#model = sequelize.define<Model<UserSettingsTable>>('user_settings', {
            ...makeColumn('userId', DataTypes.BIGINT, x, { primaryKey: true, unique: true }),
            ...makeColumn('dontDmErrors', DataTypes.BOOLEAN, x),
            ...makeColumn('prefixes', DataTypes.ARRAY(DataTypes.STRING), x),
            ...makeColumn('timezone', DataTypes.STRING, x)
        });
    }

    public async get(userId: bigint): Promise<UserSettings | undefined> {
        const model = await this.#model.findOne({ where: { userId } });
        return model?.dataValues;
    }

    public async update(userId: bigint, value: UserSettings): Promise<void> {
        await this.#model.upsert({ ...value, userId });
    }

    public async delete(userId: bigint): Promise<void> {
        await this.#model.destroy({ where: { userId } });
    }

}
