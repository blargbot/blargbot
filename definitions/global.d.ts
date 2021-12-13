import '';

declare global {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type Primitive = string | number | bigint | boolean | object | Function | symbol | undefined;
    type JToken = JObject | JArray | JValue | null;
    type JValue = string | number | boolean;
    type JObject = { [P in string]: JToken; };
    type JArray = JToken[];
    type JTokenType = keyof JTokenTypeMap;
    type JTokenTypeMap = {
        'string': string;
        'number': number;
        'boolean': boolean;
        'null': null;
        'array': JArray;
        'object': JObject;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    type ClassOf<T> = (Function & { prototype: T; }) | (abstract new (...args: never) => T);
    type PropertyNamesOfType<T, P> = { [K in keyof T]: T[K] extends P ? K : never }[keyof T];
    type PropertiesOfType<T, P> = { [K in PropertyNamesOfType<T, P>]: T[K] }
    type Intersect<T1, T2> = { [K in (keyof T1 & keyof T2)]: T1[K] extends T2[K] ? T2[K] extends T1[K] ? T1[K] : never : never };

    type UppercaseFirst<T extends string> = T extends `${infer L}${infer R}` ? `${Uppercase<L>}${R}` : T;
    type LowercaseFirst<T extends string> = T extends `${infer L}${infer R}` ? `${Lowercase<L>}${R}` : T;
    type LowerLetter = Lowercase<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'>;
    type UpperLetter = Uppercase<LowerLetter>;
    type Letter = LowerLetter | UpperLetter;
    type Numeric = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
    type Alphanumeric = Letter | Numeric;

    type Coalesce<T, U> = [T] extends [never] ? U : T;
    type Mutable<T> = { -readonly [P in keyof T]: T[P] }
    // eslint-disable-next-line @typescript-eslint/ban-types
    type DeepMutable<T> = T extends Exclude<Primitive, object> ? T : { -readonly [P in keyof T]: DeepMutable<T[P]>; };
    type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];
    type SplitString<T extends string, Splitter extends string> = string extends T | Splitter ? string[] : _StringSplitHelper<T, Splitter, []>;
    type _StringSplitHelper<T extends string, Splitter extends string, Result extends string[]> =
        T extends `${infer R}${Splitter}${infer Rest}` ? _StringSplitHelper<Rest, Splitter, [...Result, R]>
        : Splitter extends '' ? Result
        : [...Result, T];

    type x = SplitString<'aaa', 'a'>

    interface ObjectConstructor {
        keys<TKey extends string>(value: { [P in TKey]: unknown }): TKey[];
        keys<TString extends string>(value: TString): Array<`${number}`>;
        keys<TArray extends unknown[]>(value: TArray): Array<`${number}`>;
        keys(value: number | boolean | bigint): [];
        values<T>(value: Exclude<T, undefined | null>): T extends Array<infer R> ? R[] : T extends number | boolean | bigint ? [] : T extends string ? SplitString<T, ''> : Array<T[keyof T]>;
        entries<TKey extends PropertyKey, TValue>(value: { [P in TKey]: TValue; }): Array<[TKey & string, TValue]>;
        entries<TKey extends PropertyKey, TValue>(value: { [P in TKey]?: TValue; }): Array<[TKey & string, TValue | undefined]>;
        // eslint-disable-next-line @typescript-eslint/ban-types
        create<T extends object>(value: T): T;
        fromEntries<TKey extends PropertyKey, TValue>(entries: Iterable<readonly [TKey, TValue]>): Record<TKey, TValue>;

        defineProperties<T, U>(o: T, properties: { [P in keyof U]: StrongPropertyDescriptor<U[P]> }): T & U;
        defineProperty<T, Key extends PropertyKey, U>(o: T, key: Key, attributes: StrongPropertyDescriptor<U>): T & { [P in Key]: U; };
    }

    interface StrongPropertyDescriptor<T> {
        configurable?: boolean;
        enumerable?: boolean;
        value?: T;
        writable?: boolean;
        get?(): T;
        set?(v: T): void;
    }

    interface Boolean {
        toString(): 'true' | 'false';
    }

    interface JSON {
        parse(text: string): JToken;
    }

    interface ArrayConstructor {
        isArray(value: unknown): value is readonly unknown[] | unknown[];
    }

    interface Array<T> {
        includes<R>(this: T extends R ? R extends T ? never : this : never, value: R): value is T & R;
    }

    interface Set<T> {
        has<R>(this: T extends R ? R extends T ? never : this : never, value: R): value is T & R;
    }

    interface ReadonlySet<T> {
        has<R>(this: T extends R ? R extends T ? never : this : never, value: R): value is T & R;
    }

    type Awaitable<T> = T | PromiseLike<T>;
    type ExcludeExact<T, U> = T extends U ? U extends T ? never : T : T;

    namespace NodeJS {
        type WorkerProcess = Process & Required<Pick<Process, 'send'>>;

        interface Process {
            kill(): true;
        }
    }

    interface String {
        toLowerCase<T extends string>(this: T): Lowercase<T>;
        toUpperCase<T extends string>(this: T): Uppercase<T>;
        split<T extends string, Splitter extends string>(this: T, splitter: Splitter): SplitString<T, Splitter>;
        toString<T extends string>(this: T): T;
    }

    interface Number {
        toString<T extends number>(this: T): `${T}`;
    }

    interface BigInt {
        toString<T extends bigint>(this: T): `${T}`;
    }

    function setTimeout<TArgs extends unknown[]>(callback: (...args: TArgs) => void, ms: number, ...args: TArgs): NodeJS.Timeout;
}
