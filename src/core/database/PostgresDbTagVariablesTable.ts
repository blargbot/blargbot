import { SubtagVariableType } from '@cluster/utils/constants/subtagVariableType'; // TODO Core shouldnt reference cluster
import { Logger } from '@core/Logger';
import { TagVariablesTable } from '@core/types';
import { guard } from '@core/utils';

import { PostgresDb } from './base';

export class PostgresDbTagVariablesTable implements TagVariablesTable {
    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: Logger
    ) {
    }

    public async upsert(values: Record<string, JToken>, type: SubtagVariableType, scope: string): Promise<void> {
        const model = this.postgres.models.bbtagVariables;
        const trans = await this.postgres.sequelize.transaction();
        for (const [key, value] of Object.entries(values)) {
            const query = {
                name: key.substring(0, 255),
                scope: scope,
                type: type
            };
            try {
                if (guard.hasValue(value))
                    await model.upsert({ ...query, content: JSON.stringify(value) });
                else
                    await model.destroy({ where: query });
            } catch (err: unknown) {
                this.logger.error(query, err);
            }
        }
        return await trans.commit();
    }

    public async get(name: string, type: SubtagVariableType, scope: string): Promise<JToken> {
        const record = await this.postgres.models.bbtagVariables.findOne({
            where: {
                name: name.substring(0, 255),
                type: type,
                scope: scope
            }
        });
        if (!guard.hasValue(record))
            return record;
        try {
            return JSON.parse(record.content);
        } catch {
            return record.content;
        }
    }
}
