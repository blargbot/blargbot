import { format, IFormatString, IFormatStringDefinition, IFormatter } from './types';

export interface ITranslatableStringDefinition<T extends string, V> extends IFormatStringDefinition<T, V> {
    readonly id: string;
    readonly template: T;
}

export class TranslatableString<T extends string, V> implements IFormatString<T> {
    static readonly #defined = new Set<ITranslatableStringDefinition<string, never>>();
    static readonly #idMap = new Map<string, ITranslatableStringDefinition<string, never>>();

    public readonly definition: ITranslatableStringDefinition<T, V>;
    public readonly template: T;
    public readonly value: V;

    public constructor(definition: ITranslatableStringDefinition<T, V>, value: V) {
        TranslatableString.#verify(definition);
        this.definition = definition;
        this.template = definition.template;
        this.value = value;
        Object.freeze(this);
    }

    public [format](formatter: IFormatter): string {
        return formatter.format(this.template, this.value);
    }

    static #verify(definition: ITranslatableStringDefinition<string, never>): void {
        if (!TranslatableString.#defined.has(definition))
            throw new Error('Unknown translation');
    }

    public static define<V, T extends string = string>(id: string, template: T): IFormatStringDefinition<T, V> {
        if (TranslatableString.#idMap.has(id))
            throw new Error('Duplicate translation id');

        const result = Object.assign(function (v: V): TranslatableString<T, V> {
            return new TranslatableString(result, v);
        }, { id, template });

        Object.freeze(result);
        TranslatableString.#idMap.set(id, result);
        TranslatableString.#defined.add(result);
        return result;
    }

    public static create<T extends string>(id: string, template: T, value?: unknown): IFormatString<T> {
        return TranslatableString.define(id, template)(value);
    }

    public static list(): Iterable<ITranslatableStringDefinition<string, never>> {
        return TranslatableString.#defined.values();
    }
}

Object.freeze(TranslatableString);
