import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import { defaultSettings } from './defaultSettings.js';
import type { GuildSettings } from './GuildSettings.js';
import type { IGuildSettingsDatabase } from './IGuildSettingsDatabase.js';

interface GuildSettingsTable extends GuildSettings {
    guildId: bigint;
}

export default class GuildSettingsSequelizeDatabase implements IGuildSettingsDatabase {
    readonly #model: ModelStatic<Model<GuildSettingsTable>>;

    public constructor(sequelize: Pick<Sequelize, 'define'>) {
        const x = {
            ...defaultSettings(),
            guildId: undefined as bigint | undefined
        };
        this.#model = sequelize.define<Model<GuildSettingsTable>>('guild_settings', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true, unique: true }),
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
            ...makeColumn('announceChannel', DataTypes.BIGINT, x),
            ...makeColumn('announceRole', DataTypes.BIGINT, x),
            ...makeColumn('adminRole', DataTypes.BIGINT, x),
            ...makeColumn('mutedRole', DataTypes.BIGINT, x),
            ...makeColumn('banWarnCount', DataTypes.INTEGER, x),
            ...makeColumn('kickWarnCount', DataTypes.INTEGER, x),
            ...makeColumn('timeoutWarnCount', DataTypes.INTEGER, x)
        });
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
