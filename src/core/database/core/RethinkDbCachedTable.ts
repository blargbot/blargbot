import { RethinkDb } from './RethinkDb';
import { RethinkTableMap } from '../types';
import { RethinkDbTable } from './RethinkDbTable';
import { WriteChange } from 'rethinkdb';
import { Cache } from '../../Cache';
import { guard, sleep } from '../../utils';
import { Logger } from '../../Logger';

export abstract class RethinkDbCachedTable<T extends keyof RethinkTableMap, K extends string & keyof RethinkTableMap[T], M extends RethinkTableMap[T]> extends RethinkDbTable<T> {
    protected readonly cache: Cache<string & RethinkTableMap[T][K], M>;

    protected constructor(
        table: T,
        protected readonly keyName: K,
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super(table, rethinkDb, logger);
        this.cache = new Cache(5, 'minutes');
    }

    protected async rget(
        key: string & RethinkTableMap[T][K],
        skipCache = false
    ): Promise<M | undefined> {
        if (skipCache || !this.cache.has(key)) {
            const result = await super.rget(key);
            if (result !== undefined)
                this.cache.set(key, <M>result);
        }
        return this.cache.get(key, true);
    }


    public async watchChanges(shouldCache: (id: RethinkTableMap[T][K]) => boolean = () => true): Promise<void> {
        this.logger.info(`Registering a ${this.table} changefeed!`);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            try {
                /* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
                const changefeed = this.rstream<WriteChange>(t => t.changes({ squash: true }));
                for await (const data of changefeed) {
                    if (!guard.hasValue(data.new_val))
                        this.cache.delete(data.old_val[this.keyName]);
                    else {
                        const id = data.new_val[this.keyName] as string & RethinkTableMap[T][K];
                        if (this.cache.has(id) || shouldCache(id))
                            this.cache.set(id, data.new_val);
                    }
                }
                /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
            }
            catch (err: unknown) {
                this.logger.warn(`Error from changefeed for table '${this.table}', will try again in 10 seconds.`, err);
                await sleep(10000);
            }
        }
    }
}

