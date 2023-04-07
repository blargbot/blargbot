import type { SearchData, SearchKey } from '@blargbot/search-client';
import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn, QueryTypes } from '@blargbot/sequelize';

export class SearchDatabase {
    readonly #searchValues: ModelStatic<Model<SearchData>>;
    readonly #sequelize: Pick<Sequelize, 'define' | 'query'>;
    readonly #searchQuery: string;
    readonly #resultColumn: string;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'query'>) {
        this.#sequelize = sequelize;
        const x: Partial<SearchData> = {};
        this.#searchValues = sequelize.define<Model<SearchData>>('search_term', {
            ...makeColumn('scope', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('type', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('key', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('value', DataTypes.STRING, x)
        });

        this.#resultColumn = getColumnName(this.#searchValues, 'value');
        this.#searchQuery = searchQuery(this.#searchValues.table.tableName, {
            scope: getColumnName(this.#searchValues, 'scope'),
            type: getColumnName(this.#searchValues, 'type'),
            key: getColumnName(this.#searchValues, 'key'),
            value: getColumnName(this.#searchValues, 'value')
        }, 'types', 'scope', 'query');
    }

    public async search(query: string, types: string[], scope: string): Promise<bigint[]> {
        if (types.length === 0 || query.length === 0)
            return [];

        const records = await this.#sequelize.query<{ [key: string]: string | number; score: number; }>(
            this.#searchQuery,
            {
                replacements: {
                    guildId: scope,
                    query: query.replaceAll(/[\\%_]/g, v => `\\${v}`),
                    entities: types
                },
                type: QueryTypes.SELECT
            }
        );
        const fuzzy = [];
        const exact = [];
        for (const record of records) {
            const entityId = BigInt(record[this.#resultColumn]);
            if (record.score === MatchQuality.EXACT)
                exact.push(entityId);
            else
                fuzzy.push(entityId);
        }
        return exact.length === 0 ? fuzzy : exact;
    }

    public async set(value: SearchData): Promise<void> {
        await this.#searchValues.upsert(value);
    }

    public async delete(value: Partial<SearchKey>): Promise<void> {
        await this.#searchValues.destroy({ where: { ...value } });
    }
}

const enum MatchQuality {
    NONE,
    ICONTAINS,
    CONTAINS,
    ISTARTSWITH,
    STARTSWITH,
    IEXACT,
    EXACT
}

const searchQuery = (tableName: string, columns: Record<keyof SearchData, string>, types: string, scope: string, query: string): string => `
SELECT "${columns.value}", MAX(${queryScore(columns.key, query)}) AS score
FROM ${tableName}
WHERE "${columns.scope}" = :${scope}
AND "${columns.type}" IN :${types}
AND ${queryScore(columns.key, query)} != ${MatchQuality.NONE}
GROUP BY "${columns.value}"
ORDER BY MAX(${queryScore(columns.key, query)}) DESC, "${columns.value}"`;

const queryScore = (column: string, query: string): string => `
CASE
    WHEN "${column}" LIKE :${query} THEN ${MatchQuality.EXACT}
    WHEN "${column}" ILIKE :${query} THEN ${MatchQuality.IEXACT}
    WHEN "${column}" LIKE :${query} || '%' THEN ${MatchQuality.STARTSWITH}
    WHEN "${column}" ILIKE :${query} || '%' THEN ${MatchQuality.ISTARTSWITH}
    WHEN "${column}" LIKE '%' || :${query} || '%' THEN ${MatchQuality.CONTAINS}
    WHEN "${column}" ILIKE '%' || :${query} || '%' THEN ${MatchQuality.ICONTAINS}
    ELSE ${MatchQuality.NONE}
END`;

function getColumnName<T extends NonNullable<unknown>>(model: ModelStatic<Model<T>>, name: string & keyof T): string {
    const attrs = model.modelDefinition.attributes.get(name);
    if (attrs === undefined)
        throw new Error(`Unknown attribute ${name}`);
    return attrs.columnName;
}
