import type { SearchData } from '@blargbot/search-client';
import type { Model, ModelStatic, Sequelize } from '@blargbot/sequelize';
import { DataTypes, makeColumn, QueryTypes } from '@blargbot/sequelize';

export class SearchDatabase {
    readonly #searchValues: ModelStatic<Model<SearchData>>;
    readonly #sequelize: Pick<Sequelize, 'define' | 'query'>;
    readonly #searchQuery: (types: readonly string[], scope: string, query: string) => string;
    readonly #resultColumn: string;

    public constructor(sequelize: Pick<Sequelize, 'define' | 'query' | 'escape'>) {
        this.#sequelize = sequelize;
        const x: Partial<SearchData> = {};
        this.#searchValues = sequelize.define<Model<SearchData>>('search_term', {
            ...makeColumn('scope', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('type', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('key', DataTypes.STRING, x, { primaryKey: true }),
            ...makeColumn('value', DataTypes.STRING, x)
        });

        this.#resultColumn = getColumnName(this.#searchValues, 'value');
        this.#searchQuery = searchQuery(
            sequelize.escape.bind(sequelize),
            this.#searchValues.table.tableName,
            {
                scope: getColumnName(this.#searchValues, 'scope'),
                type: getColumnName(this.#searchValues, 'type'),
                key: getColumnName(this.#searchValues, 'key'),
                value: getColumnName(this.#searchValues, 'value')
            }
        );
    }

    public async search(query: string, types: string[], scope: string): Promise<bigint[]> {
        if (types.length === 0 || query.length === 0)
            return [];
        query = query.replaceAll(/[\\%_]/g, v => `\\${v}`);
        const records = await this.#sequelize.query<{ [key: string]: string | number; score: number; }>(
            this.#searchQuery(types, scope, query),
            {
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

    public async delete(value: Partial<SearchData>): Promise<void> {
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

const searchQuery = (escape: (value: string) => string, tableName: string, columns: Record<keyof SearchData, string>): (types: readonly string[], scope: string, query: string) => string => (types, scope, query) => {
    const score = queryScore(escape, columns.key, query);
    return `
SELECT "${columns.value}", MAX(${score}) AS score
FROM ${tableName}
WHERE "${columns.scope}" = ${escape(scope)}
AND "${columns.type}" IN (${types.map(t => `${escape(t)}`).join(', ')})
AND ${score} != ${MatchQuality.NONE}
GROUP BY "${columns.value}"
ORDER BY MAX(${score}) DESC, "${columns.value}"`;
};

const queryScore = (escape: (value: string) => string, column: string, query: string): string => {
    query = escape(query);
    return `
CASE
    WHEN "${column}" LIKE ${query} THEN ${MatchQuality.EXACT}
    WHEN "${column}" ILIKE ${query} THEN ${MatchQuality.IEXACT}
    WHEN "${column}" LIKE ${query} || '%' THEN ${MatchQuality.STARTSWITH}
    WHEN "${column}" ILIKE ${query} || '%' THEN ${MatchQuality.ISTARTSWITH}
    WHEN "${column}" LIKE '%' || ${query} || '%' THEN ${MatchQuality.CONTAINS}
    WHEN "${column}" ILIKE '%' || ${query} || '%' THEN ${MatchQuality.ICONTAINS}
    ELSE ${MatchQuality.NONE}
END`;
};

function getColumnName<T extends NonNullable<unknown>>(model: ModelStatic<Model<T>>, name: string & keyof T): string {
    const attrs = model.modelDefinition.attributes.get(name);
    if (attrs === undefined)
        throw new Error(`Unknown attribute ${name}`);
    return attrs.columnName;
}
