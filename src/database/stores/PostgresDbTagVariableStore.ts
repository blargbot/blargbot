import { guard } from '@blargbot/core/utils';
import { BBTagVariable, TagVariableScope, TagVariableType } from '@blargbot/domain/models';
import { TagVariableStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import { ENUM, Op, STRING, TEXT, WhereOptions } from 'sequelize';

import { PostgresDb } from '../clients';
import { PostgresDbTable } from '../tables/PostgresDbTable';

export class PostgresDbTagVariableStore implements TagVariableStore {
    readonly #table: PostgresDbTable<BBTagVariable>;

    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: Logger
    ) {
        this.#table = new PostgresDbTable<BBTagVariable>(postgres, 'bbtag_variable', {
            name: {
                type: STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: ENUM(...Object.values(TagVariableType)),
                primaryKey: true,
                allowNull: false
            },
            scope: {
                type: STRING,
                primaryKey: true,
                allowNull: false
            },
            content: {
                type: TEXT,
                allowNull: false
            }
        });
    }

    public async clearScope(scope: TagVariableScope): Promise<void> {
        let where: WhereOptions<BBTagVariable>;
        if (scope.entityId === undefined) {
            where = {
                type: scope.type
            };
        } else if (scope.name !== undefined) {
            where = {
                type: scope.type,
                scope: `${scope.entityId}_${scope.name}`
            };
        } else {
            where = {
                type: scope.type,
                scope: {
                    [Op.like]: {
                        [Op.any]: [scope.entityId, `${scope.entityId}\\_%`]
                    }
                }
            };
        }
        await this.#table.destroy({ where });
    }

    public async upsert(values: Record<string, JToken | undefined>, scope: TagVariableScope): Promise<void> {
        const trans = await this.postgres.transaction();
        for (const [key, value] of Object.entries(values)) {
            const query = {
                name: key.substring(0, 255),
                scope: [scope.entityId, scope.name].filter(guard.hasValue).join('_'),
                type: scope.type
            };
            try {
                if (guard.hasValue(value))
                    await this.#table.upsert({ ...query, content: JSON.stringify(value) });
                else
                    await this.#table.destroy({ where: query });
            } catch (err: unknown) {
                this.logger.error(query, err);
            }
        }
        return await trans.commit();
    }

    public async get(name: string, scope: TagVariableScope): Promise<JToken | undefined> {
        const record = await this.#table.get({
            where: {
                name: name.substring(0, 255),
                scope: [scope.entityId, scope.name].filter(guard.hasValue).join('_'),
                type: scope.type
            }
        });

        if (!guard.hasValue(record))
            return undefined;
        try {
            return JSON.parse(record.content);
        } catch {
            return record.content;
        }
    }
}
