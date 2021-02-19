import { SubtagVariableType } from '../../utils';
import { PostgresDb } from './core/PostgresDb';
import { TagVariablesTable } from './types';

export class PostgresDbTagVariablesTable implements TagVariablesTable {
    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: CatLogger
    ) {
    }

    public async upsert(values: Record<string, JToken>, type: SubtagVariableType, scope: string): Promise<void> {
        const trans = await this.postgres.sequelize.transaction();
        for (const key in values) {
            const query = {
                content: JSON.stringify(values[key]),
                name: key.substring(0, 255),
                scope: scope,
                type: type
            };
            try {
                await this.postgres.models.BBTagVariableModel?.upsert(query);
            } catch (err) {
                this.logger.error(err);
                if (err.errors) {
                    for (const e of err.errors)
                        this.logger.error(e.path, e.validatorKey, e.value);
                }
                this.logger.info(query);
            }
        }
        return await trans.commit();
    }

    public async get(name: string, type: SubtagVariableType, scope: string): Promise<JToken> {
        const record = await this.postgres.models.BBTagVariableModel?.findOne({
            where: {
                name: name.substring(0, 255),
                type: type,
                scope: scope
            }
        });
        if (!record)
            return undefined;

        try {
            return JSON.parse(record.content);
        } catch {
            return record.content;
        }
    }
}