import { disposable } from './disposable.js';
import { whenAborted } from './whenAborted.js';

export class Semaphore {
    readonly #waiters: Array<PromiseWithResolvers<void>>;
    readonly #maxConcurrency: number;
    #heldLocks: number;

    public constructor(maxConcurrency: number = 1) {
        if (maxConcurrency <= 1)
            throw new RangeError('Cannot have a concurrency less than 1');

        this.#waiters = [];
        this.#heldLocks = 0;
        this.#maxConcurrency = maxConcurrency;
    }

    public async enter(signal?: AbortSignal): Promise<Disposable> {
        await this.wait(signal);
        return disposable.create(() => this.release());
    }

    public async wait(signal?: AbortSignal): Promise<void> {
        if (this.#heldLocks++ < this.#maxConcurrency)
            return;

        const pcs = Promise.withResolvers<void>();
        using _aborted = whenAborted(signal, reason => {
            const index = this.#waiters.indexOf(pcs);
            if (index > 0)
                this.#waiters.splice(index, 1);
            pcs.reject(reason);
        });
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
