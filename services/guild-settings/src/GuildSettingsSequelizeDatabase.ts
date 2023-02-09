import type { AttributeOptions, DataType, Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes } from '@blargbot/sequelize';

import { defaultSettings } from './defaultSettings.js';
import type { GuildSettings } from './GuildSettings.js';
import type { IGuildSettingsDatabase } from './IGuildSettingsDatabase.js';

interface GuildSettingsTable extends GuildSettings {
    guildId: bigint;
}

export default class GuildSettingsSequelizeDatabase implements IGuildSettingsDatabase {
    readonly #model: ModelStatic<Model<GuildSettingsTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x = defaultSettings();
        this.#model = sequelize.define<Model<GuildSettingsTable>>('guild_settings', {
            guildId: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                unique: true,
                allowNull: false
            },
            ...makeColumn('maxAllowedMentions', DataTypes.INTEGER, x),
            ...makeColumn('actOnLimitsOnly', DataTypes.BOOLEAN, x),
            ...makeColumn('cahNsfw', DataTypes.BOOLEAN, x),
            ...makeColumn('notifyCommandMessageDelete', DataTypes.BOOLEAN, x),
            ...makeColumn('disableEveryone', DataTypes.BOOLEAN, x),
            ...makeColumn('disableNoPerms', DataTypes.BOOLEAN, x),
            ...makeColumn('dmHelp', DataTypes.BOOLEAN, x),
            ...makeColumn('enableChatlogging', DataTypes.BOOLEAN, x),
            ...makeColumn('noCleverBot', DataTypes.BOOLEAN, x),
            ...makeColumn('prefixes', DataTypes.ARRAY(DataTypes.STRING), x),
            ...makeColumn('enableSocialCommands', DataTypes.BOOLEAN, x),
            ...makeColumn('tableFlip', DataTypes.BOOLEAN, x),
            ...makeColumn('language', DataTypes.STRING, x),
            ...makeColumn('staffPerms', DataTypes.BIGINT, x),
            ...makeColumn('banOverridePerms', DataTypes.BIGINT, x),
            ...makeColumn('kickOverridePerms', DataTypes.BIGINT, x),
            ...makeColumn('timeoutOverridePerms', DataTypes.BIGINT, x),
            ...makeColumn('greetChannel', DataTypes.BIGINT, x),
            ...makeColumn('farewellChannel', DataTypes.BIGINT, x),
            ...makeColumn('modLogChannel', DataTypes.BIGINT, x),
            ...makeColumn('adminRole', DataTypes.BIGINT, x),
            ...makeColumn('mutedRole', DataTypes.BIGINT, x),
            ...makeColumn('banWarnCount', DataTypes.INTEGER, x),
            ...makeColumn('kickWarnCount', DataTypes.INTEGER, x),
            ...makeColumn('timeoutWarnCount', DataTypes.INTEGER, x)
        });
    }

    public async sync(): Promise<void> {
        console.log('Syncing guild_settings model');
        await this.#model.sync();
        console.log('guild_settings model syncronised');
    }

    public async get(guildId: bigint): Promise<GuildSettings | undefined> {
        const model = await this.#model.findOne({ where: { guildId } });
        return model?.get();
    }

    public async update(guildId: bigint, value: GuildSettings): Promise<void> {
        await this.#model.upsert({ ...value, guildId });
    }

    public async delete(guildId: bigint): Promise<void> {
        await this.#model.destroy({ where: { guildId } });
    }

}

function makeColumn<Name extends keyof M, M extends object>(name: Name, type: DataType, base: M): { [P in Name]: AttributeOptions<Model<M>> } {
    return {
        [name]: {
            type,
            allowNull: base[name] as unknown === null,
            defaultValue: base[name]
        } as AttributeOptions<Model<M>>
    } as { [P in Name]: AttributeOptions<Model<M>> };
}
