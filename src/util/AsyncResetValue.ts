import { raceSignal } from './raceSignal.js';
import { whenAborted } from './whenAborted.js';

export class AsyncResetValue<T> {
    #pending: Promise<T>;
    #resolve?: (value: Awaitable<T>) => void;
    #reject?: (error: unknown) => void;
    #registration?: Disposable;
    #done = false;

    public get hasValue(): boolean {
        return this.#resolve === undefined;
    }

    public constructor() {
        const { promise, resolve, reject } = Promise.withResolvers<T>();
        this.#pending = promise;
        this.#resolve = resolve;
        this.#reject = reject;
    }

    public async getValue(signal?: AbortSignal): Promise<T> {
        return await raceSignal(this.#pending, signal);
    }

    public resolve(value: Awaitable<T>, signal?: AbortSignal): void {
        if (this.#done)
            return;

        this.#registration?.[Symbol.dispose]();
        this.#registration = whenAborted(signal, () => this.clear());
        if (this.#resolve === undefined) {
            this.#pending = Promise.resolve(value);
        } else {
            this.#resolve(value);
            this.#resolve = undefined;
            this.#reject = undefined;
        }
    }

    public reject(error: unknown): void {
        this.#done = true;
        if (this.#reject === undefined) {
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            this.#pending = Promise.reject(error);
        } else {
            this.#reject(error);
        }
    }

    public clear(): void {
        if (this.#done)
            return;

        if (this.#resolve === undefined) {
            const { promise, resolve, reject } = Promise.withResolvers<T>();
            this.#pending = promise;
            this.#resolve = resolve;
            this.#reject = reject;
        }
    }
}
