import { whenAborted } from './whenAborted.js';

export class ResetValue<T> {
    #state: { type: 'pending'; } | { type: 'resolved'; value: T; } | { type: 'rejected'; error: unknown; };
    #registration?: Disposable;

    public get value(): T {
        switch (this.#state.type) {
            case 'pending':
                throw new Error('No value has been set yet.');
            case 'rejected':
                throw this.#state.error;
            case 'resolved':
                return this.#state.value;
        }
    }

    public get hasValue(): boolean {
        return this.#state.type === 'resolved';
    }

    public constructor() {
        this.#state = { type: 'pending' };
    }

    public resolve(value: T, signal?: AbortSignal): void {
        if (this.#state.type === 'rejected')
            return;

        this.#registration?.[Symbol.dispose]();
        this.#registration = whenAborted(signal, () => this.clear());
        this.#state = { type: 'resolved', value };
    }

    public reject(error: unknown): void {
        this.#registration?.[Symbol.dispose]();
        this.#registration = undefined;
        this.#state = { type: 'rejected', error };
    }

    public clear(): void {
        if (this.#state.type === 'rejected')
            return;

        this.#registration?.[Symbol.dispose]();
        this.#registration = undefined;
        this.#state = { type: 'pending' };
    }
}
