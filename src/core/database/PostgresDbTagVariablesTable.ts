import { Logger } from '@core/Logger';
import { SubtagVariableType, TagVariablesTable } from '@core/types';
import { guard } from '@core/utils';

import { PostgresDb } from './base';

export class PostgresDbTagVariablesTable implements TagVariablesTable {
    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: Logger
    ) {
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
                    await this.postgres.bbtagVariables.upsert({ ...query, content: JSON.stringify(value) });
                else
                    await this.postgres.bbtagVariables.destroy({ where: query });
            } catch (err: unknown) {
                this.logger.error(query, err);
            }
        }
        return await trans.commit();
    }

    public async get(name: string, type: SubtagVariableType, scope: string): Promise<JToken | undefined> {
        const model = await this.postgres.bbtagVariables.findOne({
            where: {
                name: name.substring(0, 255),
                type: type,
                scope: scope
            }
        });

        const record = model?.get();

        if (!guard.hasValue(record))
            return undefined;
        try {
            return JSON.parse(record.content);
        } catch {
            return record.content;
        }
    }
}
