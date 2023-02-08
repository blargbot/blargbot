import type { Model, ModelStatic, Sequelize } from 'sequelize';
import { ARRAY, BIGINT, BOOLEAN, STRING } from 'sequelize';

import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';
import type { UserSettings } from './UserSettings.js';

interface UserSettingsTable extends UserSettings {
    readonly userId: bigint;
}

export default class UserSettingsSequelizeDatabase implements IUserSettingsDatabase {
    readonly #model: ModelStatic<Model<UserSettingsTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        this.#model = sequelize.define<Model<UserSettingsTable>>('user_settings', {
            userId: {
                type: BIGINT,
                primaryKey: true,
                allowNull: false
            },
            dontdmerrors: {
                type: BOOLEAN,
                defaultValue: false
            },
            prefixes: {
                type: ARRAY(STRING),
                defaultValue: () => []
            },
            timezone: {
                type: STRING,
                allowNull: true
            }
        });
    }

    public async sync(): Promise<void> {
        console.log('Syncing user_settings model');
        await this.#model.sync();
        console.log('user_settings model syncronised');
    }

    public async get(userId: bigint): Promise<UserSettings | undefined> {
        const model = await this.#model.findOne({ where: { userId } });
        return model?.dataValues;
    }

    public async update(userId: bigint, value: UserSettings): Promise<void> {
        await this.#model.update({ ...value, userId }, { where: { userId } });
    }

    public async delete(userId: bigint): Promise<void> {
        await this.#model.destroy({ where: { userId } });
    }

}
