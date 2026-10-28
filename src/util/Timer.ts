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

    public get duration(): Temporal.Duration {
        const ms = Math.trunc(this.elapsed);
        const ns = (this.elapsed - ms) * 1_000_000;
        return Temporal.Duration.from({
            milliseconds: ms,
            nanoseconds: Math.round(ns)
        });
    }

    static readonly #durationFormat = new Intl.DurationFormat('en', { style: 'long' });
    static readonly #listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    static readonly #formatUnits = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'] as const;
    public format(): string {
        const duration = this.duration.round({ smallestUnit: 'milliseconds' });
        const segments = Timer.#formatUnits
            .filter(v => duration[v] !== 0)
            .map(v => Timer.#durationFormat.format({ [v]: duration[v] }));
        if (segments.length === 0)
            return Timer.#durationFormat.format({ seconds: 0 });
        return Timer.#listFormat.format(segments);
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
