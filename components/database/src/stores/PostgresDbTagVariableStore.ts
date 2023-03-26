import type { TagVariableScope, TagVariableScopeFilter } from '@bbtag/blargbot';
import { TagVariableType } from '@bbtag/blargbot';
import type { BBTagVariable } from '@blargbot/domain/models/index.js';
import type { TagVariableStore } from '@blargbot/domain/stores/index.js';
import { hasValue } from '@blargbot/guards';
import type { Logger } from '@blargbot/logger';
import type { FindOptions, WhereOperators } from '@blargbot/sequelize';
import { DataTypes, Op } from '@blargbot/sequelize';

import type { PostgresDb } from '../clients/index.js';
import { PostgresDbTable } from '../tables/PostgresDbTable.js';

export class PostgresDbTagVariableStore implements TagVariableStore {
    readonly #table: PostgresDbTable<BBTagVariable>;

    public constructor(
        protected readonly postgres: PostgresDb,
        protected readonly logger: Logger
    ) {
        this.#table = new PostgresDbTable<BBTagVariable>(postgres, 'bbtag_variable', {
            name: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            type: {
                type: DataTypes.ENUM(...Object.values(TagVariableType).filter(v => v !== TagVariableType.TEMP)),
                primaryKey: true,
                allowNull: false
            },
            scope: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            },
            content: {
                type: DataTypes.TEXT,
                allowNull: false
            }
        });
    }

    public async getScope(scope: TagVariableScopeFilter): Promise<Array<{ scope: TagVariableScope; name: string; value: JToken; }>> {
        const values = await this.#table.getAll(this.#buildScopeQuery(scope));
        return values.map(v => ({
            scope: idToVariableScope(v.scope, v.type),
            name: v.name,
            value: deserialize(v.content)
        }));
    }

    public async clearScope(scope: TagVariableScopeFilter): Promise<void> {
        await this.#table.destroy(this.#buildScopeQuery(scope));
    }

    #buildScopeQuery(scope: TagVariableScopeFilter): FindOptions<BBTagVariable> {
        return {
            where: {
                type: scope.type,
                scope: variableScopeToFilter(scope)
            }
        };
    }

    public async upsert(entries: Iterable<{ name: string; scope: TagVariableScope; value: JToken | undefined; }>): Promise<void> {
        await this.postgres.transaction(async () => {
            for (const { name, scope, value } of entries) {
                if (scope.type === TagVariableType.TEMP)
                    continue;
                const query = {
                    name: name.substring(0, 255),
                    scope: variableScopeToId(scope),
                    type: scope.type
                };
                try {
                    if (hasValue(value))
                        await this.#table.upsert({ ...query, content: JSON.stringify(value) });
                    else
                        await this.#table.destroy({ where: query });
                } catch (err: unknown) {
                    this.logger.error(query, err);
                }
            }
        });
    }

    public async get(name: string, scope: TagVariableScope): Promise<JToken | undefined> {
        const record = await this.#table.get({
            where: {
                name: name.substring(0, 255),
                scope: variableScopeToId(scope),
                type: scope.type
            }
        });

        return hasValue(record)
            ? deserialize(record.content)
            : undefined;
    }
}

function deserialize(value: string): JToken {
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function variableScopeToId(scope: TagVariableScope): string {
    switch (scope.type) {
        case TagVariableType.AUTHOR: return scope.authorId;
        case TagVariableType.GLOBAL: return '';
        case TagVariableType.TEMP: return '';
        case TagVariableType.GUILD_CC: return scope.guildId;
        case TagVariableType.GUILD_TAG: return scope.guildId;
        case TagVariableType.LOCAL_CC: return `${scope.guildId}_${scope.name}`;
        case TagVariableType.LOCAL_TAG: return scope.name;

    }
}

function idToVariableScope(id: string, type: TagVariableScope['type']): TagVariableScope {
    switch (type) {
        case TagVariableType.AUTHOR: return { type, authorId: id };
        case TagVariableType.GLOBAL: return { type };
        case TagVariableType.GUILD_CC: return { type, guildId: id };
        case TagVariableType.GUILD_TAG: return { type, guildId: id };
        case TagVariableType.LOCAL_CC: {
            const splitAt = id.indexOf('_');
            if (splitAt === -1)
                throw new Error('Invalid id, missing an _');
            return { type, guildId: id.slice(0, splitAt), name: id.slice(splitAt + 1) };
        }
        case TagVariableType.LOCAL_TAG: return { type, name: id };
        case TagVariableType.TEMP: return { type };
    }
}

function variableScopeToFilter(scope: TagVariableScopeFilter): string | readonly string[] | WhereOperators<string> | { [Op.or]: Array<WhereOperators<string>>; } | undefined {
    switch (scope.type) {
        case TagVariableType.AUTHOR: return scope.authorId;
        case TagVariableType.GLOBAL: return scope.type;
        case TagVariableType.TEMP: return undefined;
        case TagVariableType.GUILD_TAG: return scope.guildId;
        case TagVariableType.GUILD_CC: return scope.guildId;
        case TagVariableType.LOCAL_TAG: return scope.name;
        case TagVariableType.LOCAL_CC: {
            const { guildId, name } = scope;
            const guildIds = typeof guildId === 'string' ? [guildId] : guildId ?? [];
            const names = typeof name === 'string' ? [name] : name ?? [];

            if (guildIds.length === 0) {
                const conditions = names.map(name => ({
                    [Op.regexp]: `^[0-9]+\\_${name.replaceAll(/['|*+?{},()[\]\\_%]/g, x => `\\${x}$`)}`
                }));
                return conditions.length > 1
                    ? { [Op.or]: conditions }
                    : conditions[0];
            }

            if (names.length === 0) {
                const conditions = guildIds.map(guildId => ({
                    [Op.like]: `${guildId}\\_%`
                }));
                return conditions.length > 1
                    ? { [Op.or]: conditions }
                    : conditions[0];
            }

            return guildIds.flatMap(g => names.map(n => `${g}_${n}`));
        }
    }
}
