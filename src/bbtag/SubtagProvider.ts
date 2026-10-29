import { Subtag } from './Subtag.js';

interface SubtagConstructor<T extends Subtag = Subtag> {
    new(...args: never): T;
    readonly prototype: T;
}

export class SubtagProvider implements Iterable<Subtag> {
    readonly #subtagsByClass: ReadonlyMap<SubtagConstructor, Subtag>;
    readonly #subtagsByName: ReadonlyMap<string, Subtag>;
    readonly #subtagInstances: Set<Subtag>;

    public constructor(source: Iterable<Subtag>) {
        this.#subtagInstances = new Set(source);
        this.#subtagsByClass = new Map(this.#subtagInstances.values().map(v => {
            if (!(v instanceof Subtag))
                throw new Error(`${String(v)} is not a Subtag`);
            const ctor = v.constructor;
            if (!(v instanceof ctor))
                throw new Error(`Unable to determine the class of ${String(v)}`);
            return [ctor as SubtagConstructor, v];
        }));
        const subtags = new Map<string, Subtag>();
        for (const subtag of this.#subtagInstances) {
            for (const name of subtagNames(subtag)) {
                const current = subtags.get(name);
                if (current !== undefined)
                    throw new Error(`Duplicate subtag with name ${JSON.stringify(subtag.name)} found`);
                subtags.set(name, subtag);
            }
        }
        this.#subtagsByName = subtags;
    }

    public get<T extends Subtag>(type: SubtagConstructor<T>): T {
        const result = this.#subtagsByClass.get(type);
        if (result === undefined)
            throw new Error(`The ${type.name} subtag has not been installed.`);
        return result as T;
    }

    public find(name: string): Subtag | undefined {
        name = name.toLowerCase();
        return this.#subtagsByName.get(name)
            ?? this.#subtagsByName.get(`${name.split('.', 1)[0]}.`);
    }

    public [Symbol.iterator](): SetIterator<Subtag> {
        return this.#subtagInstances.values();
    }
}

function* subtagNames(subtag: Subtag): Generator<string> {
    yield subtag.name.toLowerCase();
    for (const alias of subtag.aliases)
        yield alias.toLowerCase();
}
