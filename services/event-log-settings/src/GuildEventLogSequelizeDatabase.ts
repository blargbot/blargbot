import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { IGuildEventLogDatabase } from './IGuildEventLogDatabase.js';

interface GuildEventLogsTable {
    readonly guildId: bigint;
    readonly event: string;
    readonly channelId: bigint;
}

export default class GuildEventLogSequelizeDatabase implements IGuildEventLogDatabase {
    readonly #eventLogs: ModelStatic<Model<GuildEventLogsTable>>;
    readonly #sequelize: Pick<Sequelize, 'define' | 'transaction'>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        this.#sequelize = sequelize;
        const x = defaultUserWarnings;
        this.#eventLogs = sequelize.define<Model<GuildEventLogsTable>>('event_logs', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('event', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('channelId', DataTypes.BIGINT, x)
        }, {
            indexes: [
                {
                    fields: ['guildId', 'event'],
                    unique: true
                }
            ]
        });
    }

    public async get(guildId: bigint, event: string): Promise<bigint | null> {
        const model = await this.#eventLogs.findOne({ where: { guildId, event } });
        return model?.get().channelId ?? null;
    }

    public async list(guildId: bigint): Promise<Record<string, bigint>> {
        const models = await this.#eventLogs.findAll({ where: { guildId } });
        return Object.fromEntries(models.map(m => {
            const { channelId, event } = m.get();
            return [event, channelId] as const;
        }));
    }

    public async set(guildId: bigint, event: string, channelId: bigint): Promise<void> {
        await this.#eventLogs.upsert({ guildId, event, channelId });
    }

    public async clear(guildId: bigint): Promise<string[]>
    public async clear(guildId: bigint, event: string): Promise<void>
    public async clear(guildId: bigint, event?: string | undefined): Promise<string[] | void> {
        if (event !== undefined)
            return void await this.#eventLogs.destroy({ where: { guildId, event } });

        return await this.#sequelize.transaction(async () => {
            const events = await this.#eventLogs.findAll({ where: { guildId } });
            const result = events.map(e => e.get().event);
            await this.#eventLogs.destroy({ where: { guildId } });
            return result;
        });
    }

}

const defaultUserWarnings: { [P in keyof Required<GuildEventLogsTable>]: GuildEventLogsTable[P] | undefined } = {
    guildId: undefined,
    event: undefined,
    channelId: undefined
};
