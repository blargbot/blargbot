import { format, IFormatString, IFormatStringDefinition, IFormatter } from './types';

export class FormatString<T extends string, V> implements IFormatString<T> {
    static readonly #defined = new Set<IFormatStringDefinition<string, never>>();
    static readonly #idMap = new Map<string, IFormatStringDefinition<string, never>>();

    public readonly id: string;
    public readonly template: T;
    public readonly value: V;

    public constructor(definition: IFormatStringDefinition<T, V>, value: V) {
        FormatString.#verify(definition);
        this.template = definition.template;
        this.id = definition.id;
        this.value = value;
        Object.freeze(this);
    }

    public [format](formatter: IFormatter): string {
        return formatter.format(this);
    }

    static #verify(definition: IFormatStringDefinition<string, never>): void {
        if (!FormatString.#defined.has(definition))
            throw new Error('Unknown translation');
    }

    public static define<V, T extends string = string>(id: string, template: T): IFormatStringDefinition<T, V> {
        if (FormatString.#idMap.has(id))
            throw new Error('Duplicate translation id');

        const result = Object.assign(function (v: V): FormatString<T, V> {
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
            result[key] = typeof entry === 'function'
                ? entry(`${prefix}.${key}`)
                : this.#defineTree(`${prefix}.${key}`, entry);
        }
        return result;
    }

    public static create<T extends string>(id: string, template: T, value?: unknown): IFormatString<T> {
        return FormatString.define(id, template)(value);
    }

    public static list(): Iterable<IFormatStringDefinition<string, never>> {
        return FormatString.#defined.values();
    }
}

Object.freeze(FormatString);

function treeUtil<V>(): <T extends string>(template: T) => FormatTreeEntryFactory<IFormatStringDefinition<T, V>>;
function treeUtil<T extends string>(template: T, value?: unknown): FormatTreeEntryFactory<IFormatString<T>>;
function treeUtil(...args: [] | [template: string, value?: unknown]): FormatTreeEntryFactory | ((template: string) => FormatTreeEntryFactory) {
    return args.length === 0
        ? (t: string) => (id: string) => FormatString.define(id, t)
        : (id: string) => FormatString.create(id, ...args);
}

type FormatTreeUtil = typeof treeUtil;
type FormatTreeEntryDefinition<T extends string = string> = IFormatString<T> | IFormatStringDefinition<T, never>;
type FormatTreeEntryFactory<T extends FormatTreeEntryDefinition = FormatTreeEntryDefinition> = (id: string) => T;
type FormatTreeDefinition = {
    [P in string]: FormatTreeDefinition | FormatTreeEntryFactory
};

type FormatTree<T extends FormatTreeDefinition> = {
    [P in keyof T]: FormatTreeEntry<T[P]>
};
type FormatTreeEntry<T extends FormatTreeDefinition[string]> = T extends FormatTreeEntryFactory<infer R> ? R
    : T extends FormatTreeDefinition ? FormatTree<T>
    : never;
