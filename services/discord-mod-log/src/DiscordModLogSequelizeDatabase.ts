import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { DiscordModLogEntry } from './DiscordModLogEntry.js';
import type { IDiscordModLogEntryDatabase } from './IDiscordModLogEntryDatabase.js';

export default class DiscordModLogSequelizeDatabase implements IDiscordModLogEntryDatabase {
    readonly #modLog: ModelStatic<Model<DiscordModLogEntry>>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        const x = defaultModLogEntry;
        this.#modLog = sequelize.define<Model<DiscordModLogEntry>>('moderation_log_discord_messages', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('caseId', DataTypes.INTEGER, x, { primaryKey: true }),
            ...makeColumn('channelId', DataTypes.BIGINT, x),
            ...makeColumn('messageId', DataTypes.BIGINT, x)
        }, {
            indexes: [
                {
                    fields: ['guildId', 'caseId'],
                    unique: true
                }
            ]
        });
    }

    public async delete(guildId: bigint, caseId: number): Promise<void> {
        await this.#modLog.destroy({ where: { guildId, caseId } });
    }

    public async get(guildId: bigint, caseId: number): Promise<DiscordModLogEntry | undefined> {
        const model = await this.#modLog.findOne({ where: { guildId, caseId } });
        return model?.get();
    }

    public async set(options: DiscordModLogEntry): Promise<void> {
        await this.#modLog.create(options);
    }

}

const defaultModLogEntry: { [P in keyof Required<DiscordModLogEntry>]: DiscordModLogEntry[P] | undefined } = {
    caseId: undefined,
    guildId: undefined,
    channelId: undefined,
    messageId: undefined
};
