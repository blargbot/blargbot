import type { ModLogCreateRequest, ModLogDeleteRequest, ModLogUpdateRequest } from '@blargbot/mod-log-client';
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
            ...makeColumn('lastCaseId', DataTypes.INTEGER, y)
        });
        const x = defaultModLogEntry;
        this.#modLog = sequelize.define<Model<ModLogEntryTable>>('moderation_log', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('caseId', DataTypes.INTEGER, x, { primaryKey: true }),
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

    public async create(options: ModLogCreateRequest): Promise<ModLogEntry> {
        return await this.#sequelize.transaction(async () => {
            const [index] = await this.#modLogIndex.findOrCreate({
                where: { guildId: options.guildId },
                defaults: { guildId: options.guildId, lastCaseId: 0 }
            });
            await index.increment('lastCaseId');
            const result = await this.#modLog.create({
                ...options,
                caseId: index.get().lastCaseId
            });
            return result.get();
        });
    }

    async #getModLog(guildId: bigint, caseId: number): Promise<Model<ModLogEntry> | undefined> {
        return await this.#modLog.findOne({
            where: { guildId, caseId }
        }) ?? undefined;
    }

    public async update({ guildId, caseId, ...update }: ModLogUpdateRequest): Promise<ModLogEntry | undefined> {
        const model = await this.#getModLog(guildId, caseId);
        await model?.update(update);
        return model?.get();
    }

    public async delete({ guildId, caseId }: ModLogDeleteRequest): Promise<ModLogEntry | undefined> {
        const model = await this.#getModLog(guildId, caseId);
        const result = model?.get();
        await model?.destroy();
        return result;
    }

}

const defaultModLogEntry: { [P in keyof Required<ModLogEntryTable>]: ModLogEntryTable[P] | undefined } = {
    caseId: undefined,
    guildId: undefined,
    moderatorId: null,
    reason: null,
    type: undefined,
    userId: undefined
};

const defaultModLogIndex: { [P in keyof Required<ModLogIndex>]: ModLogIndex[P] | undefined } = {
    guildId: undefined,
    lastCaseId: 0
};
