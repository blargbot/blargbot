import { BotVariable, GetBotVariableOptions } from '@blargbot/domain/models';
import { BotVariableStore } from '@blargbot/domain/stores';
import { Logger } from '@blargbot/logger';

import { RethinkDb } from '../clients';
import { RethinkDbTable } from '../tables/RethinkDbTable';

export class RethinkDbBotVariableStore implements BotVariableStore {
    #table: RethinkDbTable<BotVariable>;

    public constructor(rethinkDb: RethinkDb, logger: Logger) {
        this.#table = new RethinkDbTable(`vars`, rethinkDb, logger);
    }

    public async get<K extends BotVariable[`varname`]>(key: K): Promise<GetBotVariableOptions<K> | undefined>
    public async get(key: string): Promise<BotVariable | undefined> {
        return await this.#table.get(key);
    }

    public async set<K extends BotVariable[`varname`]>(name: K, value: GetBotVariableOptions<K>): Promise<boolean>
    public async set(name: BotVariable[`varname`], value: Omit<BotVariable, `varname`>): Promise<boolean> {
        return await this.#table.set(name, { varname: name, ...value } as BotVariable);
    }

    public async delete<K extends BotVariable[`varname`]>(key: K): Promise<boolean> {
        return await this.#table.delete(key);
    }
}
