import { RethinkDb } from './RethinkDb';
import { RethinkTableMap } from '../types';
import { RethinkDbTable } from './RethinkDbTable';
import { sleep } from '../../../utils';
import { WriteChange } from 'rethinkdb';

export abstract class RethinkDbCachedTable<T extends keyof RethinkTableMap, K extends string & keyof RethinkTableMap[T]> extends RethinkDbTable<T> {
    protected readonly cache: Record<string, RethinkTableMap[T] | undefined>;

    protected constructor(
        table: T,
        protected readonly keyName: K,
        rethinkDb: RethinkDb,
        logger: CatLogger
    ) {
        super(table, rethinkDb, logger);
        this.cache = {};
    }

    protected async rgetCached(
        key: string,
        skipCache: boolean
    ): Promise<RethinkTableMap[T] | undefined> {
        const result = skipCache ? undefined : this.cache[key];
        if (result !== undefined)
            return result;
        return this.cache[key] = await this.rget(key);
    }


    public async watchChanges(shouldCache: (id: RethinkTableMap[T][K]) => boolean = () => true): Promise<void> {
        this.logger.info(`Registering a ${this.table} changefeed!`);
        while (true) {
            try {
                const changefeed = this.rethinkDb.stream<WriteChange>(r => r.table(this.table).changes({ squash: true }));
                for await (const data of changefeed) {
                    if (!data.new_val)
                        delete this.cache[data.old_val[this.keyName]];
                    else {
                        const id = data.new_val[this.keyName];
                        if (this.cache[id] !== undefined || shouldCache(id))
                            this.cache[id] = data.new_val;
                    }
                }
            }
            catch (err) {
                this.logger.warn(`Error from changefeed for table '${this.table}', will try again in 10 seconds.`, err);
                await sleep(10000);
            }
        }
    }
}

