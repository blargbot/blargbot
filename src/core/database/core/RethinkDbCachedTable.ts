import { RethinkDb } from './RethinkDb';
import { RethinkTableMap } from '../types';
import { RethinkDbTable } from './RethinkDbTable';
import { Cache } from '../../Cache';
import { guard, sleep } from '../../utils';
import { Logger } from '../../Logger';

export abstract class RethinkDbCachedTable<TableName extends keyof RethinkTableMap, Key extends string & keyof RethinkTableMap[TableName]> extends RethinkDbTable<TableName> {
    protected readonly cache: Cache<RethinkTableMap[TableName][Key], RethinkTableMap[TableName]>;

    protected constructor(
        table: TableName,
        protected readonly keyName: Key,
        rethinkDb: RethinkDb,
        logger: Logger
    ) {
        super(table, rethinkDb, logger);
        this.cache = new Cache(5, 'minutes');
    }

    protected async rget(
        key: string & RethinkTableMap[TableName][Key],
        skipCache = false
    ): Promise<RethinkTableMap[TableName] | undefined> {
        if (skipCache || !this.cache.has(key)) {
            const result = await super.rget(key);
            if (result !== undefined)
                this.cache.set(key, result);
        }
        return this.cache.get(key, true);
    }

    public async watchChanges(shouldCache: (id: RethinkTableMap[TableName][Key]) => boolean = () => true): Promise<void> {
        this.logger.info(`Registering a ${this.table} changefeed!`);
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, no-constant-condition
        while (true) {
            try {
                const changefeed = this.rstream(t => t.changes({ squash: true }));
                for await (const data of changefeed) {
                    if (!guard.hasValue(data.new_val)) {
                        if (guard.hasValue(data.old_val))
                            this.cache.delete(data.old_val[this.keyName]);
                    } else {
                        const id = data.new_val[this.keyName];
                        if (this.cache.has(id) || shouldCache(id))
                            this.cache.set(id, data.new_val);
                    }
                }
                /* eslint-enable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
            } catch (err: unknown) {
                this.logger.warn(`Error from changefeed for table '${this.table}', will try again in 10 seconds.`, err);
                await sleep(10000);
            }
        }
    }
}
