import type { ModLogCreateRequest, ModLogDeleteRequest, ModLogUpdateRequest } from '@blargbot/mod-log-client';
import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn } from '@blargbot/sequelize';

import type { IModLogEntryDatabase } from './IModLogEntryDatabase.js';
import type { ModLogEntry } from './ModLogEntry.js';

interface ModLogIndex {
    readonly guildId: bigint;
    readonly lastCaseId: number;
}

export default class ModLogSequelizeDatabase implements IModLogEntryDatabase {
    readonly #modLog: ModelStatic<Model<ModLogEntry>>;
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
        this.#modLog = sequelize.define<Model<ModLogEntry>>('moderation_log', {
            ...makeColumn('guildId', DataTypes.BIGINT, x, { primaryKey: true }),
            ...makeColumn('caseId', DataTypes.INTEGER, x, { primaryKey: true }),
            ...makeColumn('moderatorId', DataTypes.BIGINT, x),
            ...makeColumn('reason', DataTypes.STRING, x),
            ...makeColumn('timestamp', DataTypes.DATE, x),
            ...makeColumn('type', DataTypes.STRING, x),
            ...makeColumn('users', DataTypes.ARRAY(DataTypes.BIGINT), x),
            ...makeColumn('metadata', DataTypes.JSON, x)
        }, {
            indexes: [
                {
                    fields: ['guildId', 'caseId'],
                    unique: true
                }
            ]
        });
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
                caseId: index.get().lastCaseId,
                timestamp: new Date(),
                metadata: options.metadata ?? {}
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

const defaultModLogEntry: { [P in keyof Required<ModLogEntry>]: ModLogEntry[P] | undefined } = {
    caseId: undefined,
    guildId: undefined,
    moderatorId: null,
    reason: null,
    timestamp: undefined,
    type: undefined,
    users: undefined,
    metadata: {}
};

const defaultModLogIndex: { [P in keyof Required<ModLogIndex>]: ModLogIndex[P] | undefined } = {
    guildId: undefined,
    lastCaseId: 0
};
