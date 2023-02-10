import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { IModLogEntryDatabase } from './IModLogEntryDatabase.js';
import type { ModLogEntry } from './ModLogEntry.js';

interface ModLogEntryTable extends ModLogEntry {
    readonly guildId: bigint;
}

interface ModLogIndex {
    readonly guildId: bigint;
    readonly lastCaseId: number;
}

export default class ModLogSequelizeDatabase implements IModLogEntryDatabase {
    readonly #modLog: ModelStatic<Model<ModLogEntryTable>>;
    readonly #modLogIndex: ModelStatic<Model<ModLogIndex>>;
    readonly #sequelize: Pick<Sequelize, 'transaction'>;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'transaction'>) {
        this.#sequelize = sequelize;
        const y = defaultModLogIndex;
        this.#modLogIndex = sequelize.define<Model<ModLogIndex>>('moderation_log_index', {
            ...makeColumn('guildId', DataTypes.BIGINT, y, { primaryKey: true, unique: true }),
            ...makeColumn('lastCaseId', DataTypes.INTEGER({ unsigned: true }), y)
        });
        const x = defaultModLogEntry;
        this.#modLog = sequelize.define<Model<ModLogEntryTable>>('moderation_log', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('caseId', DataTypes.INTEGER({ unsigned: true }), x, { primaryKey: true }),
            ...makeColumn('channelId', DataTypes.BIGINT, x),
            ...makeColumn('messageId', DataTypes.BIGINT, x),
            ...makeColumn('moderatorId', DataTypes.BIGINT, x),
            ...makeColumn('reason', DataTypes.STRING, x),
            ...makeColumn('type', DataTypes.STRING, x),
            ...makeColumn('userId', DataTypes.BIGINT, x)
        }, {
            indexes: [
                {
                    fields: ['guildId', 'caseId'],
                    unique: true
                }
            ]
        });
    }

    public async get(guildId: bigint, caseId: number): Promise<ModLogEntry | undefined> {
        const model = await this.#modLog.findOne({ where: { guildId, caseId } });
        return model?.get();
    }

    public async list(guildId: bigint): Promise<ModLogEntry[]> {
        const models = await this.#modLog.findAll({ where: { guildId } });
        return models.map(m => m.get());
    }

    public async create(guildId: bigint, value: Omit<ModLogEntry, 'caseId'>): Promise<number> {
        return await this.#sequelize.transaction(async () => {
            const [index] = await this.#modLogIndex.findOrCreate({
                where: { guildId },
                defaults: { guildId, lastCaseId: 0 }
            });
            await index.increment('lastCaseId');
            const result = await this.#modLog.create({
                ...value,
                guildId,
                caseId: index.get().lastCaseId
            });
            return result.get().caseId;
        });
    }

    public async update(guildId: bigint, caseId: number, value: Partial<Omit<ModLogEntry, 'caseId'>>): Promise<void> {
        await this.#modLog.update({
            ...value,
            guildId,
            caseId
        }, { where: { guildId, caseId } });
    }

    public async delete(guildId: bigint, caseId: number): Promise<void> {
        await this.#modLog.destroy({ where: { guildId, caseId } });
    }

}

const defaultModLogEntry: { [P in keyof Required<ModLogEntryTable>]: ModLogEntryTable[P] | undefined } = {
    guildId: undefined,
    caseId: undefined,
    userId: undefined,
    channelId: null,
    messageId: null,
    moderatorId: null,
    reason: null,
    type: null
};

const defaultModLogIndex: { [P in keyof Required<ModLogIndex>]: ModLogIndex[P] | undefined } = {
    guildId: undefined,
    lastCaseId: 0
};
