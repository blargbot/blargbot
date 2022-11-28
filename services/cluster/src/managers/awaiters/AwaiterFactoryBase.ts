import { Semaphore } from '@blargbot/core/Semaphore';
import { Logger } from '@blargbot/logger';

import { Awaiter } from './Awaiter';

export abstract class AwaiterFactoryBase<T> {
    readonly #awaiters: Record<string, Array<Awaiter<T>> | undefined>;
    readonly #poolLocks: Record<string, Semaphore>;

    protected constructor(protected readonly logger: Logger) {
        this.#awaiters = {};
        this.#poolLocks = {};
    }

    protected abstract getPoolId(item: T): string;

    public async tryConsume(item: T): Promise<boolean> {
        const poolId = this.getPoolId(item);
        const awaiters = this.#awaiters[poolId];
        if (awaiters === undefined)
            return false;

        const lock = this.#poolLocks[poolId] ??= new Semaphore(1);
        await lock.wait();
        try {
            for (const awaiter of awaiters) {
                try {
                    if (await awaiter.tryConsume(item))
                        return true;
                } catch (err: unknown) {
                    this.logger.error(err);
                }
            }
            return false;
        } finally {
            if (lock.release() === 0)
                delete this.#poolLocks[poolId];
            if (awaiters.length === 0)
                delete this.#awaiters[poolId];
        }
    }

    public getAwaiter(pools: Iterable<string>, check: (item: T) => Awaitable<boolean> = () => true, timeout = 300000): Awaiter<T> {
        const poolSet = new Set(pools);

        const awaiter = new Awaiter(poolSet, this.#awaiters, check, timeout);
        if (poolSet.size === 0)
            awaiter.cancel();
        return awaiter;
    }
}
