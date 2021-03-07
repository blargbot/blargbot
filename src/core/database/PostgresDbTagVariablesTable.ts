import { SubtagVariableType } from '../../utils';
import { PostgresDb } from './core/PostgresDb';
import { TagVariablesTable } from './types';

export class PostgresDbTagVariablesTable implements TagVariablesTable {
    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: CatLogger
    ) {
    }

    public async upsert(values: Record<string, string | undefined>, type: SubtagVariableType, scope: string): Promise<void> {
        const model = this.postgres.models.BBTagVariableModel;
        if (model === undefined)
            throw new Error('The postgres models havent been configured!');

        const trans = await this.postgres.sequelize.transaction();
        for (const key in values) {
            const value = values[key];
            const query = {
                name: key.substring(0, 255),
                scope: scope,
                type: type
            };
            try {
                if (key !== undefined && key.length > 0)
                    await model.upsert({ ...query, content: JSON.stringify(value) });
                else
                    await model.destroy({ where: query });
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

    public async get(name: string, type: SubtagVariableType, scope: string): Promise<string | undefined> {
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
            const result = JSON.parse(record.content);
            switch (typeof result) {
                case 'string': return result;
                case 'undefined': return undefined;
                case 'object':
                    if (result === null)
                        return undefined;
                default: return record.content;
            }
        } catch {
            return record.content;
        }
    }
}