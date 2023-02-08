import { PromiseCompletionSource } from './PromiseCompletionSource.js';

export class Semaphore {
    readonly #waiters: Array<PromiseCompletionSource<void>>;
    readonly #maxConcurrency: number;
    #heldLocks: number;

    public constructor(maxConcurrency: number) {
        this.#waiters = [];
        this.#heldLocks = 0;
        this.#maxConcurrency = maxConcurrency;
    }

    public async wait(): Promise<void> {
        if (this.#heldLocks++ < this.#maxConcurrency)
            return;

        const pcs = new PromiseCompletionSource<void>();
        this.#waiters.push(pcs);
        await pcs.promise;
    }

    public release(): number {
        if (this.#heldLocks === 0)
            throw new Error('No locks are currently being held');
        const waiter = this.#waiters.shift();
        waiter?.resolve();
        return --this.#heldLocks;
    }
}
