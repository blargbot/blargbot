import type { BBTagVariable } from '@blargbot/bbtag-variables-client';

import type { IBBTagVariablesDatabase } from './IBBTagVariablesDatabase.js';

export class BBTagVariablesService {
    readonly #database: IBBTagVariablesDatabase;

    public constructor(database: IBBTagVariablesDatabase) {
        this.#database = database;
    }

    public async getVariable(ownerId: bigint, scope: string, name: string): Promise<BBTagVariable> {
        return await this.#database.get(ownerId, scope, name) ?? { name, ownerId, scope, value: null };
    }

    public async getAllVariables(ownerId: bigint, scope: string, names: Iterable<string>): Promise<BBTagVariable[]> {
        return await this.#database.getAll(ownerId, scope, names);
    }

    public async setVariable(ownerId: bigint, scope: string, name: string, value: JToken): Promise<void> {
        return await this.#database.set(ownerId, scope, name, value);
    }

    public async setAllVariables(ownerId: bigint, scope: string, values: Record<string, JToken>): Promise<void> {
        return await this.#database.setAll(ownerId, scope, values);
    }

    public async clearVariables(ownerId: bigint, scope?: string): Promise<void> {
        return await this.#database.clear(ownerId, scope);
    }
}
