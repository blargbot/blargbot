import { guard, sleep } from '@blargbot/core/utils/index.js';
import type { Logger } from '@blargbot/logger';
import type { UpdateRequest } from 'rethinkdb';

import { Cache } from '../Cache.js';
import type { RethinkDb } from '../clients/index.js';
import { RethinkDbTable } from './RethinkDbTable.js';

export class RethinkDbCachedTable<Table extends { [P in KeyName]: string }, KeyName extends string> extends RethinkDbTable<Table> {
    public readonly cache: Cache<string, Table>;
    #keyName: KeyName;

    public constructor(
        table: string,
        keyName: KeyName,
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super(table, rethinkDb, logger);
        this.cache = new Cache(5, 'minutes');
        this.#keyName = keyName;
    }

    public getKey(value: Table): string {
        return value[this.#keyName];
    }

    public async get(
        key: string,
        skipCache = false
    ): Promise<Table | undefined> {
        if (skipCache || !this.cache.has(key)) {
            const result = await super.get(key);
            if (result !== undefined)
                this.cache.set(key, result);
            else
                this.cache.delete(key);
        }
        return this.cache.get(key, true);
    }

    public async insert(value: Table, returnValue?: false): Promise<boolean>
    public async insert(value: Table, returnValue: true): Promise<Table | undefined>
    public async insert(value: Table, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.insert(value, false);

        const result = await super.insert(value, true);
        if (result !== undefined)
            this.cache.set(this.getKey(result), value);

        return returnValue === true ? result : result !== undefined;
    }

    public async set(key: string, value: Table, returnValue?: false): Promise<boolean>
    public async set(key: string, value: Table, returnValue: true): Promise<Table | undefined>
    public async set(key: string, value: Table, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.set(key, value, false);

        const result = await super.set(key, value, true);
        if (result !== undefined) {
            const old = this.cache.get(key);
            if (old !== undefined) {
                Object.assign(old, result);
                this.cache.delete(key);
                this.cache.set(this.getKey(result), old);
            } else {
                this.cache.set(this.getKey(result), result);
            }
        }

        return returnValue === true ? result : result !== undefined;

    }

    public async update(key: string, value: UpdateRequest<Table>, returnValue?: false): Promise<boolean>
    public async update(key: string, value: UpdateRequest<Table>, returnValue: true): Promise<Table | undefined>
    public async update(key: string, value: UpdateRequest<Table>, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.update(key, value, false);

        const result = await super.update(key, value, true);
        if (result !== undefined) {
            const old = this.cache.get(key);
            if (old !== undefined) {
                Object.assign(old, result);
                this.cache.delete(key);
                this.cache.set(this.getKey(result), old);
            } else {
                this.cache.set(this.getKey(result), result);
            }
        }

        return returnValue === true ? result : result !== undefined;
    }

    public async delete(key: string | Partial<Table>, returnChanges?: false): Promise<boolean>
    public async delete(key: string | Partial<Table>, returnChanges: true): Promise<Table[]>
    public async delete(key: string | Partial<Table>, returnValue?: boolean): Promise<boolean | Table[]> {
        if (returnValue === false)
            return await super.delete(key, false);

        const result = await super.delete(key, true);
        for (const entry of result)
            this.cache.delete(this.getKey(entry));

        return returnValue === true ? result : result.length > 0;
    }

    public watchChanges(shouldCache: (id: string) => boolean = () => true): void {
        void this.#watchChangesCore(shouldCache);
    }

    async #watchChangesCore(shouldCache: (id: string) => boolean = () => true): Promise<never> {
        this.logger.info(`Registering a ${this.table} changefeed!`);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const changefeed = this.stream(t => t.changes({ squash: true }));
                for await (const data of changefeed) {
                    if (!guard.hasValue(data.new_val)) {
                        if (guard.hasValue(data.old_val))
                            this.cache.delete(this.getKey(data.old_val));
                    } else {
                        const id = this.getKey(data.new_val);
                        if (this.cache.has(id) || shouldCache(id))
                            this.cache.set(id, data.new_val);
                    }
                }
            } catch (err: unknown) {
                this.logger.warn(`Error from changefeed for table '${this.table}', will try again in 10 seconds.`, err);
                await sleep(10000);
            }
        }
    }
}
