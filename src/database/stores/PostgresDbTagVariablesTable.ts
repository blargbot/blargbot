import { guard } from '@blargbot/core/utils';
import { BBTagVariable, SubtagVariableType } from '@blargbot/domain/models';
import { TagVariablesTable } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';
import { ENUM, STRING, TEXT } from 'sequelize';

import { PostgresDb } from '../clients';
import { PostgresDbTable } from '../tables/PostgresDbTable';

export class PostgresDbTagVariablesTable implements TagVariablesTable {
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
                type: ENUM(...Object.values(SubtagVariableType)),
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

    public async upsert(values: Record<string, JToken | undefined>, type: SubtagVariableType, scope: string): Promise<void> {
        const trans = await this.postgres.transaction();
        for (const [key, value] of Object.entries(values)) {
            const query = {
                name: key.substring(0, 255),
                scope: scope,
                type: type
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

    public async get(name: string, type: SubtagVariableType, scope: string): Promise<JToken | undefined> {
        const record = await this.#table.get({
            where: {
                name: name.substring(0, 255),
                type: type,
                scope: scope
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
