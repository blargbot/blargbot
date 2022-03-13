import { Cache } from '@core/Cache';
import { Logger } from '@core/Logger';
import { guard, sleep } from '@core/utils';
import { UpdateRequest } from 'rethinkdb';

import { RethinkDb } from './RethinkDb';
import { RethinkDbTable } from './RethinkDbTable';

export abstract class RethinkDbCachedTable<Table extends { [P in KeyName]: string }, KeyName extends string> extends RethinkDbTable<Table> {
    protected readonly cache: Cache<string, Table>;

    protected constructor(
        table: string,
        private readonly keyName: KeyName,
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super(table, rethinkDb, logger);
        this.cache = new Cache(5, 'minutes');
    }

    protected getKey(value: Table): string {
        return value[this.keyName];
    }

    protected async rget(
        key: string,
        skipCache = false
    ): Promise<Table | undefined> {
        if (skipCache || !this.cache.has(key)) {
            const result = await super.rget(key);
            if (result !== undefined)
                this.cache.set(key, result);
            else
                this.cache.delete(key);
        }
        return this.cache.get(key, true);
    }

    protected async rinsert(value: Table, returnValue?: false): Promise<boolean>
    protected async rinsert(value: Table, returnValue: true): Promise<Table | undefined>
    protected async rinsert(value: Table, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.rinsert(value, false);

        const result = await super.rinsert(value, true);
        if (result !== undefined)
            this.cache.set(this.getKey(result), value);

        return returnValue === true ? result : result !== undefined;
    }

    protected async rset(key: string, value: Table, returnValue?: false): Promise<boolean>
    protected async rset(key: string, value: Table, returnValue: true): Promise<Table | undefined>
    protected async rset(key: string, value: Table, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.rset(key, value, false);

        const result = await super.rset(key, value, true);
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

    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue?: false): Promise<boolean>
    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue: true): Promise<Table | undefined>
    protected async rupdate(key: string, value: UpdateRequest<Table>, returnValue?: boolean): Promise<boolean | Table | undefined> {
        if (returnValue === false)
            return await super.rupdate(key, value, false);

        const result = await super.rupdate(key, value, true);
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

    protected async rdelete(key: string | Partial<Table>, returnChanges?: false): Promise<boolean>
    protected async rdelete(key: string | Partial<Table>, returnChanges: true): Promise<Table[]>
    protected async rdelete(key: string | Partial<Table>, returnValue?: boolean): Promise<boolean | Table[]> {
        if (returnValue === false)
            return await super.rdelete(key, false);

        const result = await super.rdelete(key, true);
        for (const entry of result)
            this.cache.delete(this.getKey(entry));

        return returnValue === true ? result : result.length > 0;
    }

    public watchChanges(shouldCache: (id: string) => boolean = () => true): void {
        void this.watchChangesCore(shouldCache);
    }

    private async watchChangesCore(shouldCache: (id: string) => boolean = () => true): Promise<never> {
        this.logger.info(`Registering a ${this.table} changefeed!`);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                const changefeed = this.rstream(t => t.changes({ squash: true }));
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
