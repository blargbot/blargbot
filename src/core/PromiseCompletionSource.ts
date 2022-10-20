export class PromiseCompletionSource<T> {
    #resolve: (value: Awaitable<T>) => void;
    #reject: (reason?: unknown) => void;
    #state: 'pending' | 'resolved' | 'rejected';

    public readonly promise: Promise<T>;
    public get state(): 'pending' | 'resolved' | 'rejected' { return this.#state; }

    public constructor() {
        this.#state = 'pending';
        let rejectVal: { value: unknown; } | undefined;
        let resolveVal: { value: Awaitable<T>; } | undefined;
        this.#resolve = v => resolveVal = { value: v };
        this.#reject = v => rejectVal = { value: v };
        this.promise = new Promise<T>((resolve, reject) => {
            this.#resolve = resolve;
            this.#reject = reject;

            if (rejectVal !== undefined)
                reject(rejectVal.value);
            if (resolveVal !== undefined)
                resolve(resolveVal.value);
        });
    }

    public resolve(value: Awaitable<T>): boolean {
        if (this.#state !== 'pending')
            return false;

        this.#state = 'resolved';
        this.#resolve(value);
        return true;
    }

    public reject(error?: unknown): boolean {
        if (this.#state !== 'pending')
            return false;

        this.#state = 'rejected';
        this.#reject(error);
        return true;
    }
}
