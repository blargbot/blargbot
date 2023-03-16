export class PromiseCompletionSource<T = void> extends Promise<T> {
    #resolve: (value: Awaitable<T>) => void;
    #reject: (reason?: unknown) => void;
    #state: 'pending' | 'resolved' | 'rejected';

    public get state(): 'pending' | 'resolved' | 'rejected' {
        return this.#state;
    }

    public constructor()
    public constructor(x: ConstructorParameters<typeof Promise<T>>[0] = defaultCtorArg) {
        let resolve: (value: Awaitable<T>) => void = notSetup;
        let reject: (resolve?: unknown) => void = notSetup;
        super((res, rej) => {
            x(res, rej);
            resolve = res;
            reject = rej;
        });
        this.#state = 'pending';
        this.#resolve = resolve;
        this.#reject = reject;
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

const notSetup = (): void => {
    throw null;
};

const defaultCtorArg = (): void => {
    /* NO-OP */
};
