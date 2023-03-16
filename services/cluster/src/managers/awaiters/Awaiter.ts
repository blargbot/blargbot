import { PromiseCompletionSource } from '@blargbot/async-tools';

export class Awaiter<T> {
    readonly #timeout: NodeJS.Timeout;
    readonly #waitResult: PromiseCompletionSource<T | undefined>;
    readonly #poolIds: ReadonlySet<string>;
    readonly #pools: Record<string, Array<Awaiter<T>> | undefined>;
    readonly #check: (item: T) => Awaitable<boolean>;

    public constructor(
        poolIds: ReadonlySet<string>,
        pools: Record<string, Array<Awaiter<T>> | undefined>,
        check: (item: T) => Awaitable<boolean>,
        timeout: number
    ) {
        this.#waitResult = new PromiseCompletionSource<T | undefined>();
        this.#poolIds = poolIds;
        this.#pools = pools;
        this.#check = check;

        for (const poolId of poolIds)
            (pools[poolId] ??= []).push(this);

        this.#timeout = setTimeout(() => this.cancel(), timeout);
    }

    public async wait(): Promise<T | undefined> {
        return await this.#waitResult;
    }

    public async tryConsume(item: T): Promise<boolean> {
        try {
            if (!await this.#check(item))
                return false;
            this.#waitResult.resolve(item);
            this.#cleanup();
            return true;
        } catch (ex: unknown) {
            this.#waitResult.reject(ex);
            this.#cleanup();
            return true;
        }
    }

    public cancel(): void {
        this.#waitResult.resolve(undefined);
        this.#cleanup();
    }

    #cleanup(): void {
        clearTimeout(this.#timeout);
        for (const poolId of this.#poolIds) {
            const pool = this.#pools[poolId];
            if (pool !== undefined) {
                pool.splice(pool.indexOf(this), 1);
                if (pool.length === 0)
                    delete this.#pools[poolId];
            }
        }
    }
}
