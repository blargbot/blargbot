import type { AttributeOptions, DataType, Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes } from '@blargbot/sequelize';

import { defaultSettings } from './defaultSettings.js';
import type { IUserSettingsDatabase } from './IUserSettingsDatabase.js';
import type { UserSettings } from './UserSettings.js';

interface UserSettingsTable extends UserSettings {
    readonly userId: bigint;
}

export default class UserSettingsSequelizeDatabase implements IUserSettingsDatabase {
    readonly #model: ModelStatic<Model<UserSettingsTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x = defaultSettings();
        this.#model = sequelize.define<Model<UserSettingsTable>>('user_settings', {
            userId: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            ...makeColumn('dontDmErrors', DataTypes.BOOLEAN, x),
            ...makeColumn('prefixes', DataTypes.ARRAY(DataTypes.STRING), x),
            ...makeColumn('timezone', DataTypes.STRING, x)
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
        await this.#model.upsert({ ...value, userId });
    }

    public async delete(userId: bigint): Promise<void> {
        await this.#model.destroy({ where: { userId } });
    }

}

function makeColumn<Name extends keyof M, M extends object>(name: Name, type: DataType, base: M): { [P in Name]: AttributeOptions<Model<M>> } {
    return {
        [name]: {
            type,
            allowNull: base[name] as unknown === null,
            defaultValue: base[name]
        }
    } as { [P in Name]: AttributeOptions<Model<M>> };
}
