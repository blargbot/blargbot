import { PromiseCompletionSource } from './PromiseCompletionSource.js';

type Task<T> =
    | { [Symbol.asyncIterator](): AsyncIterator<void, T, void>; }
    | { [Symbol.iterator](): Iterator<void, T, void>; }
    | { (): Awaitable<T>; }

export interface Scheduler {
    schedule<T>(task: Task<T>): Awaitable<T>;
}

export class StackScheduler implements Scheduler {
    readonly #tasks: Array<{ readonly task: AsyncIterator<void, () => void, void>; next?: Promise<IteratorResult<void, () => void>>; }>;
    #stepsAdded: PromiseCompletionSource;
    #running: boolean;

    public constructor() {
        this.#running = false;
        this.#tasks = [];
        this.#stepsAdded = new PromiseCompletionSource();
    }

    #notifyStepAdded(): void {
        const w = this.#stepsAdded;
        this.#stepsAdded = new PromiseCompletionSource();
        w.resolve();
    }

    public async schedule<T>(task: Task<T>): Promise<T> {
        return await new Promise<T>((res, rej) => {
            this.#tasks.push({ task: this.#runTask(task, res, rej) });
            this.#notifyStepAdded();
        });
    }

    async* #runTask<T>(
        task: Task<T>,
        resolve: (value: T) => void,
        reject: (error: unknown) => void
    ): AsyncGenerator<void, () => void, void> {
        try {
            return typeof task === 'function'
                ? resolve.bind(null, await task())
                : resolve.bind(null, yield* task);
        } catch (err) {
            return reject.bind(null, err);
        }
    }

    public runUntilEmpty(): AsyncGenerator<void, void, void> {
        if (this.#running)
            throw new Error('Cannot have multiple parallel calls to runToEmpty');

        this.#running = true;
        return this.#runUntilEmpty();
    }

    async * #runUntilEmpty(): AsyncGenerator<void, void, void> {
        if (this.#tasks.length === 0)
            await this.#stepsAdded;

        try {
            while (this.#tasks.length > 0) {
                const batch = this.#tasks[this.#tasks.length - 1];
                const res = await Promise.race([
                    // Order is required, incase next() syncronously adds steps.
                    // Swapping the order may lead to a deadlock
                    this.#stepsAdded,
                    batch.next ??= batch.task.next()
                ]);
                if (res === undefined)
                    // Steps were added, so leave the current step for later
                    continue;

                batch.next = undefined;
                if (res.done === true) {
                    // No steps were added and the current batch is completed, so nothing has been added to steps. We can safely pop.
                    this.#tasks.pop();
                    res.value();
                }
                yield;
            }
        } finally {
            this.#running = false;
        }
    }
}
