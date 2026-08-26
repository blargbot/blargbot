import type { IFormatString, IFormatStringDefinition, IFormatter } from './types.js';
import { format } from './types.js';

export class FormatString<T> implements IFormatString {
    static readonly #defined = new Set<IFormatStringDefinition<never>>();
    static readonly #idMap = new Map<string, IFormatStringDefinition<never>>();

    public readonly id: string;
    public readonly template: string;
    public readonly value: T;

    public constructor(definition: IFormatStringDefinition<T>, value: T) {
        FormatString.#verify(definition);
        this.template = definition.template;
        this.id = definition.id;
        this.value = value;
        Object.freeze(this);
    }

    public [format](formatter: IFormatter): string {
        return formatter.format(this);
    }

    static #verify(definition: IFormatStringDefinition<never>): void {
        if (!FormatString.#defined.has(definition))
            throw new Error('Unknown translation');
    }

    public static define<T>(id: string, template: string): IFormatStringDefinition<T> {
        if (FormatString.#idMap.has(id))
            throw new Error('Duplicate translation id');

        const result = Object.assign(function (v: T): FormatString<T> {
            return new FormatString(result, v);
        }, { id, template });

        Object.freeze(result);
        FormatString.#idMap.set(id, result);
        FormatString.#defined.add(result);
        return result;
    }

    public static defineTree<T extends FormatTreeDefinition>(prefix: string, tree: (util: FormatTreeUtil) => T): FormatTree<T>
    public static defineTree(prefix: string, tree: (util: FormatTreeUtil) => FormatTreeDefinition): FormatTree<FormatTreeDefinition> {
        return this.#defineTree(prefix, tree(treeUtil));
    }

    static #defineTree<T extends FormatTreeDefinition>(prefix: string, tree: T): FormatTree<T>
    static #defineTree(prefix: string, tree: FormatTreeDefinition): FormatTree<FormatTreeDefinition> {
        const result: FormatTree<FormatTreeDefinition> = {};
        for (const [key, entry] of Object.entries(tree)) {
            switch (typeof entry) {
                case 'string':
                    result[key] = FormatString.create(`${prefix}.${key}`, entry);
                    break;
                case 'function':
                    result[key] = entry(`${prefix}.${key}`);
                    break;
                case 'object':
                    result[key] = this.#defineTree(`${prefix}.${key}`, entry);
                    break;
            }
        }
        return result;
    }

    public static create<T extends string>(id: string, template: T, value?: unknown): IFormatString {
        return FormatString.define(id, template)(value);
    }

    public static list(): Iterable<IFormatStringDefinition<never>> {
        return FormatString.#defined.values();
    }
}

Object.freeze(FormatString);

function treeUtil<T>(template: string): (id: string) => IFormatStringDefinition<T> {
    return (id: string) => FormatString.define(id, template);
}

type FormatTreeUtil = typeof treeUtil;
type FormatTreeEntryFactory<V = never> = (id: string) => IFormatStringDefinition<V>;
type FormatTreeDefinition = {
    [P in string]: FormatTreeDefinition | FormatTreeEntryFactory | string
};

type FormatTree<T extends FormatTreeDefinition> = {
    [P in keyof T]: FormatTreeEntry<T[P]>
};
type FormatTreeEntry<T extends FormatTreeDefinition[string]> =
    T extends FormatTreeEntryFactory<infer R> ? IFormatStringDefinition<R>
    : T extends string ? IFormatString
    : T extends FormatTreeDefinition ? FormatTree<T>
    : never;
