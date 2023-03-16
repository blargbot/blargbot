import type { ISubtag } from './ISubtag.js';

export class SubtagCollection implements ISubtagLookup {
    readonly #nameMap: Map<string, ISubtag>;

    public get readonly(): ISubtagLookup {
        return new ReadonlySubtagCollectionView(this);
    }

    public constructor(subtags: Iterable<ISubtag> = []) {
        this.#nameMap = new Map();
        for (const subtag of subtags)
            this.add(subtag);
    }

    public *[Symbol.iterator](): Iterator<ISubtag> {
        yield* new Set(this.#nameMap.values());
    }

    public add(subtag: ISubtag): void {
        for (const name of subtag.names)
            this.#nameMap.set(name.toLowerCase(), subtag);
    }

    public get(name: string): ISubtag | undefined {
        return this.#nameMap.get(name.toLowerCase());
    }
}

export class ReadonlySubtagCollectionView implements ISubtagLookup {
    readonly #source: ISubtagLookup;

    public constructor(source: ISubtagLookup) {
        this.#source = source;
    }

    public *[Symbol.iterator](): Iterator<ISubtag> {
        yield* this.#source;
    }

    public get(name: string): ISubtag | undefined {
        return this.#source.get(name);
    }
}

export interface ISubtagLookup extends Iterable<ISubtag> {
    get(name: string): ISubtag | undefined;
}

export interface ISubtagCollection extends ISubtagLookup {
    add(subtag: ISubtag): void;
}
