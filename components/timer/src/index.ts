import { performance } from 'node:perf_hooks';

export class Timer {
    #elapsed: number;
    #start: number | undefined;

    public constructor() {
        this.#elapsed = 0;
    }

    public get running(): boolean { return this.#start !== undefined; }

    public get elapsed(): number {
        if (this.#start === undefined)
            return this.#elapsed;
        return this.#elapsed + (performance.now() - this.#start);
    }

    public start(reset = true): this {
        if (this.#start !== undefined)
            throw new Error('Cannot start an already started timer');
        if (reset)
            this.#elapsed = 0;
        this.#start = performance.now();
        return this;
    }

    public poll(reset = false): number {
        const elapsed = this.elapsed;
        if (reset) {
            this.end();
            this.start();
        }
        return elapsed;
    }

    public resume(): this {
        return this.start(false);
    }

    public end(): this {
        if (this.#start !== undefined) {
            this.#elapsed += performance.now() - this.#start;
            this.#start = undefined;
        }
        return this;
    }
}
