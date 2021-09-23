import { PromiseCompletionSource } from './PromiseCompletionSource';

export class Semaphore {
    private readonly waiters: Array<PromiseCompletionSource<void>>;
    private heldLocks: number;

    public constructor(private readonly maxConcurrency: number) {
        this.waiters = [];
        this.heldLocks = 0;
    }

    public async wait(): Promise<void> {
        if (this.heldLocks++ < this.maxConcurrency)
            return;

        const pcs = new PromiseCompletionSource<void>();
        this.waiters.push(pcs);
        await pcs.promise;
    }

    public release(): number {
        if (this.heldLocks === 0)
            throw new Error('No locks are currently being held');
        const waiter = this.waiters.shift();
        waiter?.resolve();
        return --this.heldLocks;
    }
}
