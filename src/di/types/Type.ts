import { IServiceProvider } from '../serviceProviders';
import { CachedIterable, MappedIterable } from '../util';
import { CompoundKeyMap } from './CompoundKeyMap';

const ctorGuard: unique symbol = Symbol();

abstract class Invariant<T> {
    // @ts-expect-error Unused variable, used to enforce invariance
    #invariant: (v: T) => T = v => v;
}

const symbolMergeMap = new CompoundKeyMap<symbol, symbol>();
function mergeSymbols(symbols: Iterable<symbol>): symbol {
    return getOrAdd(symbolMergeMap, symbols, () => {
        const descriptions = [];
        for (const symbol of symbols)
            descriptions.push(symbol.description);
        const name = `[${descriptions.join(',')}]`;
        return Symbol(name);
    });
}

const symbolOrderMap = new Map<symbol, number>();
function orderSymbols(a: symbol, b: symbol): number {
    return getOrAdd(symbolOrderMap, a, () => symbolOrderMap.size)
        - getOrAdd(symbolOrderMap, b, () => symbolOrderMap.size);
}

class TypeDef<T = unknown> extends Invariant<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static readonly any = new TypeDef<any>(ctorGuard, 'any');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public static readonly this = new TypeDef<any>(ctorGuard, 'this');
    public static readonly never = new TypeDef<never>(ctorGuard, 'never');
    public static readonly unknown = new TypeDef<unknown>(ctorGuard, 'unknown');
    public static readonly void = new TypeDef<void>(ctorGuard, 'void');

    #id?: symbol;
    public name: string;

    public get id(): symbol {
        return this.#id ??= Symbol(this.name);
    }

    public constructor(guard: typeof ctorGuard, name: string) {
        if (guard !== ctorGuard)
            throw new Error('Cannot construct types directly.');
        super();

        this.name = name;
    }

    public valueOf(): symbol {
        return this.id;
    }

    public [Symbol.toPrimitive](): symbol {
        return this.id;
    }
}

class UnionType<T> extends TypeDef<T> {
    static readonly #cache = new Map<symbol, TypeDef<unknown>>();

    public static from<T extends readonly unknown[]>(types: { readonly [P in keyof T]: TypeDef<T[P]> }): TypeDef<T[number]> {
        const flatTypes = new Set<TypeDef<T[number]>>(types.flatMap(t => t instanceof UnionType ? [...t.types] : [t]));
        flatTypes.delete(TypeDef.never as unknown as TypeDef<T[number]>);
        flatTypes.delete(TypeDef.unknown);
        switch (flatTypes.size) {
            case 0: return TypeDef.never as unknown as TypeDef<T[number]>;
            case 1: return [...flatTypes][0];
        }
        const id = mergeSymbols([...flatTypes].map(t => t.id).sort(orderSymbols));
        const type = getOrAdd(this.#cache, id, () => new UnionType(ctorGuard, flatTypes));
        return type;
    }

    private constructor(guard: typeof ctorGuard, public readonly types: ReadonlySet<T extends infer E ? TypeDef<E> : never>) {
        const names = [];
        for (const type of types)
            names.push(type.name);
        super(guard, names.join('|'));
        Object.freeze(this);
    }
}

class TupleType<T extends readonly unknown[]> extends TypeDef<T> {
    static readonly #cache = new Map<symbol, object>();

    public static from<T extends readonly unknown[]>(types: { readonly [P in keyof T]: TypeDef<T[P]> }): TypeDef<T> {
        const id = mergeSymbols(types.map(t => t.id));
        return getOrAdd(this.#cache, id, () => new TupleType<T>(ctorGuard, types));
    }

    public readonly elements: { readonly [P in keyof T]: TypeDef<T[P]> };

    private constructor(guard: typeof ctorGuard, elements: { readonly [P in keyof T]: TypeDef<T[P]> }) {
        super(guard, `[${elements.map(t => `${t.name}`).join(',')}]`);
        this.elements = elements;
        Object.freeze(this);
    }
}

class LiteralType<T extends string | number | bigint | boolean | symbol | null | undefined> extends TypeDef<T> {
    static readonly #cache = new Map<unknown, object>();

    public static from<T extends string | number | bigint | boolean | symbol | null | undefined>(value: T): TypeDef<T> {
        return getOrAdd(this.#cache, value, () => new LiteralType<T>(ctorGuard, value));
    }

    public readonly value: T;

    private constructor(guard: typeof ctorGuard, value: T) {
        super(guard, String(value));
        this.value = value;
        Object.freeze(this);
    }
}

class NewableType<T> extends TypeDef<T> {
    static readonly #cache = new Map<ClassLike<unknown, never>, object>();
    static readonly #ctorNameMap = new Map<ClassLike<unknown, never>, string>([
        [String, 'string'],
        [Number, 'number'],
        [Boolean, 'boolean'],
        [BigInt, 'bigint'],
        [Symbol, 'symbol']
    ]);

    public static from(ctor: typeof Object): TypeDef<object>;
    public static from(ctor: typeof String): TypeDef<string>;
    public static from(ctor: typeof Number): TypeDef<number>;
    public static from(ctor: typeof Boolean): TypeDef<boolean>;
    public static from(ctor: typeof BigInt): TypeDef<bigint>;
    public static from(ctor: typeof Symbol): TypeDef<symbol>;
    public static from<T>(ctor: ClassLike<T, never>): TypeDef<T>;
    public static from<T>(ctor: ClassLike<T, never>): TypeDef<T> {
        return getOrAdd(this.#cache, ctor, () => new NewableType<T>(ctorGuard, ctor));
    }

    public readonly definition: ClassLike<T, never>;

    private constructor(guard: typeof ctorGuard, definition: ClassLike<T, never>) {
        super(guard, NewableType.#ctorNameMap.get(definition) ?? `[class ${definition.name}]`);
        this.definition = definition;
        Object.freeze(this);
    }
}

class SpreadType<T> extends TypeDef<Iterable<T>> {
    static readonly #cache = new Map<object, object>();

    public static from<T>(types: TypeDef<Iterable<T>>): TypeDef<Iterable<T>> {
        return getOrAdd(this.#cache, types, () => new SpreadType<T>(ctorGuard, types));
    }

    public readonly elements: TypeDef<Iterable<T>>;

    private constructor(guard: typeof ctorGuard, elements: TypeDef<Iterable<T>>) {
        super(guard, `...${elements.name}`);
        this.elements = elements;
        Object.freeze(this);
    }
}

class MethodType<Return, Args extends readonly unknown[]> extends TypeDef<(...args: Args) => Return> {
    static readonly #cache = new Map<symbol, object>();

    public static from<Args extends readonly unknown[], Result>(returns: TypeDef<Result>, args: { [P in keyof Args]: TypeDef<Args[P]> }): TypeDef<(...args: Args) => Result> {
        const methodId = mergeSymbols([returns, ...args].map(t => t.id));
        return getOrAdd(this.#cache, methodId, () => new MethodType<Result, Args>(ctorGuard, returns, args));
    }

    public readonly returns: TypeDef<Return>;
    public readonly args: { readonly [P in keyof Args]: TypeDef<Args[P]>; };

    private constructor(guard: typeof ctorGuard, returns: TypeDef<Return>, args: { readonly [P in keyof Args]: TypeDef<Args[P]> }) {
        super(guard, `(${args.map(a => a.name).join(',')}) => ${returns.name}`);

        this.returns = returns;
        this.args = args;
        Object.freeze(this);
    }
}

class InterfaceType<T extends object> extends TypeDef<T> {
    static readonly #cache = new CompoundKeyMap<string | symbol, object>();
    readonly #template: { readonly [P in keyof T]-?: TypeDef<T[P]>; };

    public static from<T extends object, R extends Record<keyof T, unknown>>(
        templateFunc: (thisType: TypeDef<T>) => R,
        mapType: <K extends keyof T>(value: R[K], key: K) => TypeDef<T[K]>
    ): TypeDef<T> {
        const type = new InterfaceType<T>(ctorGuard, t => {
            const template = templateFunc(t);

            if (Object.getPrototypeOf(template) !== Object.prototype)
                throw new Error('The template for an interface type must be an inline definition, i.e. `{ prop1: Type.string }`');

            return Object.fromEntries(
                this.#wellOrderedKeys(template)
                    .map(k => [k, mapType(template[k] as R[keyof T], k as keyof T)] as const)
            ) as unknown as { readonly [P in keyof T]-?: TypeDef<T[P]> };
        });

        const signature = this.#wellOrderedKeys(type.#template).flatMap(k => [k, type.#template[k].id]);
        return getOrAdd(this.#cache, signature, () => type);
    }

    static #wellOrderedKeys<T extends object>(template: T): ReadonlyArray<keyof T & (string | symbol)> {
        return [
            ...Object.getOwnPropertyNames(template)
                .sort() as Array<keyof T & string>,
            ...Object.getOwnPropertySymbols(template)
                .sort(orderSymbols) as Array<keyof T & symbol>
        ];
    }

    private constructor(guard: typeof ctorGuard, templateFunc: (self: TypeDef<T>) => { readonly [P in keyof T]-?: TypeDef<T[P]> }) {
        super(guard, '<this>');
        const template = templateFunc(this);
        this.#template = template;
        const props = InterfaceType.#wellOrderedKeys(template)
            .map(k => `${typeof k === 'string' ? JSON.stringify(k) : `[${k.toString()}]`}:${template[k].name}`)
            .join(',');
        this.name = `{${props}}`;
        Object.freeze(this);
    }
}

class PromiseType<T> extends TypeDef<Promise<T>> {
    static readonly #cache = new Map<object, object>();

    public static from<T>(type: TypeDef<T>): TypeDef<Promise<T>> {
        return getOrAdd(this.#cache, type, () => new PromiseType<T>(ctorGuard, type));
    }

    public readonly inner: TypeDef<T>;

    private constructor(guard: typeof ctorGuard, type: TypeDef<T>) {
        super(guard, `Promise<${type.name}>`);
        this.inner = type;
        Object.freeze(this);
    }
}

class ArrayType<T> extends TypeDef<T[]> {
    static readonly #cache = new Map<object, object>();

    public static from<T>(type: TypeDef<T>): TypeDef<T[]> {
        return getOrAdd(this.#cache, type, () => new ArrayType<T>(ctorGuard, type));
    }

    public readonly awaited: TypeDef<T>;

    private constructor(guard: typeof ctorGuard, type: TypeDef<T>) {
        super(guard, `Array<${type.name}>`);
        this.awaited = type;
        Object.freeze(this);
    }
}

class ReadonlyArrayType<T> extends TypeDef<readonly T[]> {
    static readonly #cache = new Map<object, object>();

    public static from<T>(type: TypeDef<T>): TypeDef<readonly T[]> {
        return getOrAdd(this.#cache, type, () => new ReadonlyArrayType<T>(ctorGuard, type));
    }

    public readonly awaited: TypeDef<T>;

    private constructor(guard: typeof ctorGuard, type: TypeDef<T>) {
        super(guard, `ReadonlyArray<${type.name}>`);
        this.awaited = type;
        Object.freeze(this);
    }
}

export class Type<T = unknown> extends Invariant<T> {
    static readonly #cache = new Map<symbol, Type<unknown>>();
    static readonly #implementsCache = new Map<symbol, Set<symbol>>();
    static readonly #dependencyCache = new Map<symbol, readonly symbol[]>();

    static #from<T>(definition: TypeDef<T>): Type<T>
    static #from(definition: TypeDef): Type {
        return getOrAdd(this.#cache, definition.id, () => new Type(ctorGuard, definition));
    }

    public static implements<T>(type: Type<T>): <Impl extends T>(target: new (...args: never) => Impl) => void;
    public static implements<T extends ClassLike<unknown, never>>(target: T): Iterable<Type>;
    public static implements(arg: Type | ClassLike<unknown, unknown[]>): Iterable<Type> | ((target: new (...args: never) => unknown) => void) {
        if (arg instanceof Type) {
            return target => {
                getOrAdd(Type.#implementsCache, Type.instanceOf(target).id, () => new Set<symbol>()).add(arg.id);
                return target;
            };
        }
        const ids = Type.#implementsCache.get(Type.instanceOf(arg).id) ?? new Set<symbol>();
        return new CachedIterable(new MappedIterable(ids, id => Type.get(id)));
    }

    public static constructorArgs<Args extends readonly Type[]>(args: Args): <T extends new (...args: GetTypes<Args>) => unknown>(target: T) => void;
    public static constructorArgs<Args extends readonly unknown[]>(target: new (...args: Args) => unknown): ToTypes<Args> | undefined;
    public static constructorArgs(arg: Type[] | ClassLike<unknown, never>): readonly Type[] | undefined | ((target: new (...args: unknown[]) => unknown) => void) {
        if (Array.isArray(arg)) {
            return target => {
                this.#dependencyCache.set(Type.instanceOf(target).id, arg.map(a => a.id));
                return target;
            };
        }

        const ctorArgs = this.#dependencyCache.get(Type.instanceOf(arg).id);
        return ctorArgs?.map(id => Type.get(id));
    }

    public static get(id: symbol): Type<unknown> {
        const type = this.#cache.get(id);
        if (type === undefined)
            throw new Error('Invalid type id');
        return type;
    }

    public static literal<T extends string | number | bigint | boolean | symbol | null | undefined>(value: T): Type<T> {
        return Type.#from(LiteralType.from(value));
    }

    public static instanceOf<T>(type: ClassLike<T, never>): Type<T> {
        return Type.#from(NewableType.from(type));
    }

    public static interface<T extends object>(template: { readonly [P in keyof T]-?: Type<T[P]> }): Type<T>
    public static interface<T extends object>(template: (thisType: Type<T>) => { readonly [P in keyof T]-?: Type<T[P]> }): Type<T>
    public static interface<T extends object>(template: { readonly [P in keyof T]-?: Type<T[P]> } | ((thisType: Type<T>) => { readonly [P in keyof T]-?: Type<T[P]> })): Type<T> {
        const _template = typeof template === 'function' ? template : () => template;
        return Type.#from(InterfaceType.from(t => _template(Type.#from(t)), v => v.#definition));
    }

    public static method<Args extends readonly unknown[], Result>(result: Type<Result>, ...args: { readonly [P in keyof Args]: Type<Args[P]> }): Type<(...args: Args) => Result> {
        return Type.#from(MethodType.from<Args, Result>(result.#definition, mapTuple(args, arg => arg.#definition)));
    }

    public static union<T extends readonly unknown[]>(...types: { readonly [P in keyof T]: Type<T[P]> }): Type<T[number]> {
        return Type.#from(UnionType.from(types.map(t => t.#definition)));
    }

    public static array<T>(elements: Type<T>): Type<T[]> {
        return Type.#from(ArrayType.from(elements.#definition));
    }

    public static readonlyArray<T>(elements: Type<T>): Type<readonly T[]> {
        return Type.#from(ReadonlyArrayType.from(elements.#definition));
    }

    public static promise<T>(elements: Type<T>): Type<Promise<T>> {
        return Type.#from(PromiseType.from(elements.#definition));
    }

    public static spread<T extends readonly unknown[]>(types: Type<T>): { readonly [P in keyof T]: Type<T[P]> };
    public static spread<T>(types: Type<Iterable<T>>): Iterable<Type<T>>;
    public static spread(types: Type<Iterable<unknown>>): [Type<Iterable<unknown>>] {
        return [Type.#from(SpreadType.from(types.#definition))];
    }

    public static tuple<T extends readonly unknown[]>(...types: { readonly [P in keyof T]: Type<T[P]> }): Type<T> {
        return Type.#from(TupleType.from<T>(mapTuple(types, t => t.#definition)));
    }

    public static readonly any = Type.#from(TypeDef.any);
    public static readonly never = Type.#from(TypeDef.never);
    public static readonly unknown = Type.#from(TypeDef.unknown);
    public static readonly void = Type.#from(TypeDef.void);
    public static readonly null = Type.#from(LiteralType.from(null));
    public static readonly undefined = Type.#from(LiteralType.from(undefined));
    public static readonly object = Type.#from(NewableType.from(Object));
    public static readonly string = Type.#from(NewableType.from(String));
    public static readonly number = Type.#from(NewableType.from(Number));
    public static readonly boolean = Type.#from(NewableType.from(Boolean));
    public static readonly bigint = Type.#from(NewableType.from(BigInt));
    public static readonly symbol = Type.#from(NewableType.from(Symbol));
    public static readonly serviceProvider = Type.interface<IServiceProvider>(self => ({
        getService: Type.method(Type.any, Type.instanceOf(Type)),
        getServices: Type.method(Type.any, Type.instanceOf(Type)),
        withScope: Type.method(Type.union(Type.void, Type.void.promise), Type.method(Type.union(Type.void, Type.void.promise), self)) as Type<IServiceProvider['withScope']>
    }));

    public get name(): string { return this.#definition.name; }
    public get id(): symbol { return this.#definition.id; }
    readonly #definition: TypeDef<T>;

    public get promise(): Type<Promise<T>> {
        return Type.#from(PromiseType.from(this.#definition));
    }

    public get array(): Type<T[]> {
        return Type.array(this);
    }

    public get readonlyArray(): Type<readonly T[]> {
        return Type.readonlyArray(this);
    }

    public get iterable(): Type<Iterable<T>> {
        return Type.interface<Iterable<T>>(() => ({
            [Symbol.iterator]: Type.method(this.iterator())
        }));
    }

    public get optional(): Type<T | undefined> {
        return Type.union(this, Type.undefined);
    }

    public get nullable(): Type<T | null> {
        return Type.union(this, Type.null);
    }

    public get nullish(): Type<T | undefined | null> {
        return Type.union(this, Type.null, Type.undefined);
    }

    public get required(): Type<Exclude<T, null | undefined>> {
        switch (this.#definition as unknown) {
            case Type.undefined.#definition:
            case Type.null.#definition:
                return Type.never as unknown as Type<Exclude<T, null | undefined>>;
        }
        if (this.#definition instanceof UnionType) {
            const types = new Set(this.#definition.types);
            types.delete(Type.null.#definition);
            types.delete(Type.undefined.#definition);
            return Type.union(...[...types].map(t => Type.#from(t)));
        }
        return this as unknown as Type<Exclude<T, null | undefined>>;
    }

    public constructor(guard: typeof ctorGuard, definition: TypeDef<T>) {
        if (guard !== ctorGuard)
            throw new Error('Cannot construct types directly.');
        super();
        this.#definition = definition;
    }

    public iterator(): Type<Iterator<T>>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public iterator<TNext>(next: Type<TNext>): Type<Iterator<T, any, TNext>>
    public iterator<TNext, TReturn>(next: Type<TNext>, returns: Type<TReturn>): Type<Iterator<T, TReturn, TNext>>
    public iterator(next = Type.undefined, returns = Type.any): Type<Iterator<T>> {
        return Type.interface<Iterator<T>>(() => ({
            next: Type.method<[] | [undefined], IteratorResult<T>>(iteratorResult(this, returns), ...Type.spread(Type.union(Type.tuple(), Type.tuple(next)))),
            return: Type.method<[] | [undefined], IteratorResult<T>>(iteratorResult(this, returns), ...Type.spread(Type.union(Type.tuple(), Type.tuple(returns)))).optional,
            throw: Type.method<[] | [undefined], IteratorResult<T>>(iteratorResult(this, returns), ...Type.spread(Type.union(Type.tuple(), Type.tuple(Type.any)))).optional
        }));
    }

    public valueOf(): symbol {
        return this.id;
    }

    public [Symbol.toPrimitive](): symbol {
        return this.id;
    }
}

export type GetType<T> = T extends Type<infer R> ? R : unknown;
export type GetTypes<T extends readonly unknown[]> = { readonly [P in keyof T]: T[P] extends Type<infer R> ? R : unknown }
export type ToTypes<T extends readonly unknown[]> = { readonly [P in keyof T]: Type<T[P]>; }
export type GetTypeArgs<T extends new (...args: never) => unknown> = T extends new (...args: infer Args) => unknown ? { readonly [P in keyof Args]: Type<Args[P]> } : readonly never[];
export type ClassLike<T, Args extends readonly unknown[]> =
    | (new (...args: Args) => T)
    | (abstract new (...args: Args) => T)
    | (((...args: Args) => T) & { prototype: T; })

interface MapLike<Key, Value> {
    get(key: Key): Value | undefined;
    set(key: Key, value: Value): void;
}

function mapTuple<T extends readonly unknown[], R extends { [P in keyof T]: unknown }>(
    src: T,
    mapping: <I extends keyof T & number>(value: T[I]) => R[I]
): R {
    return src.map(mapping) as unknown as R;
}

function getOrAdd<TKey extends TBaseKey, TValue extends TBaseValue, TBaseKey, TBaseValue>(
    map: MapLike<TBaseKey, TBaseValue>,
    key: TKey,
    factory: (key: TKey) => TValue
): TValue {
    let result = map.get(key);
    if (result === undefined)
        map.set(key, result = factory(key));
    return result as TValue;
}

function iteratorResult<TYield, TReturn>(yields: Type<TYield>, returns: Type<TReturn>): Type<IteratorResult<TYield, TReturn>> {
    return Type.union(
        Type.interface<Extract<IteratorResult<TYield>, { done?: false; }>>(() => ({
            done: Type.union(Type.undefined, Type.literal(false)),
            value: yields
        })),
        Type.interface<Extract<IteratorResult<TReturn>, { done: true; }>>(() => ({
            done: Type.literal(true),
            value: returns
        }))
    );
}
