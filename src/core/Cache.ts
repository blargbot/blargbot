import moment, { Duration } from 'moment';

export class Cache<TKey, TValue> {
    /* eslint-disable @typescript-eslint/explicit-member-accessibility */
    readonly #entries: Map<TKey, { data: TValue; timeout: NodeJS.Timeout; }>;
    readonly #defaultTTL: number;
    readonly #timout: (key: TKey) => void;
    /* eslint-enable @typescript-eslint/explicit-member-accessibility */

    public constructor(defaultTimeToLive?: number | Duration);
    public constructor(...args: Parameters<typeof moment.duration>)
    public constructor(...args: [number | Duration] | Parameters<typeof moment.duration>) {
        this.#defaultTTL = toMS(moment.duration(...args));
        this.#entries = new Map();
        this.#timout = key => this.#entries.delete(key);
    }

    public has(key: TKey): boolean {
        return this.#entries.has(key);
    }

    public get(key: TKey, resetTimeToLive: boolean | Duration | number = false): TValue | undefined {
        const entry = this.#entries.get(key);
        if (entry === undefined)
            return entry;

        if (resetTimeToLive !== false) {
            clearTimeout(entry.timeout);
            const ttl = toMS(resetTimeToLive === true ? this.#defaultTTL : resetTimeToLive);
            entry.timeout = setTimeout(this.#timout, ttl, key);
        }
        return entry.data;
    }

    public delete(key: TKey): boolean {
        const entry = this.#entries.get(key);
        if (entry === undefined)
            return false;

        clearTimeout(entry.timeout);
        this.#entries.delete(key);
        return true;
    }

    public set(key: TKey, value: TValue, timeToLive?: Duration | number): this {
        const entry = this.#entries.get(key);
        if (entry !== undefined)
            clearTimeout(entry.timeout);

        const ttl = toMS(timeToLive ?? this.#defaultTTL);
        this.#entries.set(key, {
            data: value,
            timeout: setTimeout(this.#timout, ttl, key)
        });
        return this;
    }
}

function toMS(duration: number | Duration): number {
    return typeof duration === 'number'
        ? duration
        : duration.asMilliseconds();
}
