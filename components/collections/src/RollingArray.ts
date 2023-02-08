export class RollingArray<T> extends Array<T> {
    public constructor(
        public readonly maxSize: number
    ) {
        super();
        if (maxSize <= 0)
            throw new Error(`Cannot have a rolling list of size ${this.maxSize}`);
    }

    public push(...items: T[]): number {
        super.push(...items);
        this.#normalize();
        return this.length;
    }

    public splice(start: number, deleteCount: number, ...items: T[]): this {
        super.splice(start, deleteCount, ...items);
        this.#normalize();
        return this;
    }

    public unshift(...items: T[]): number {
        super.unshift(...items);
        this.#normalize(false);
        return this.length;
    }

    #normalize(shift = true): void {
        while (this.length > this.maxSize)
            shift ? this.shift() : this.pop();
    }
}
