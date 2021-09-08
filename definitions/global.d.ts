import { Snowflake as _Snowflake } from 'catflake';

declare global {
    // eslint-disable-next-line @typescript-eslint/ban-types
    type Primitive = string | number | bigint | boolean | object | Function | symbol | undefined;
    type JToken = JObject | JArray | JValue | null | undefined;
    type JValue = string | number | boolean;
    type JObject = { [key: string]: JToken; };
    type JArray = JToken[];
    type JTokenType = keyof JTokenTypeMap;
    type JTokenTypeMap = {
        'string': string;
        'number': number;
        'boolean': boolean;
        'undefined': undefined;
        'null': null;
        'array': JArray;
        'object': JObject;
    }

    type Configuration = typeof import('@config')
    type Snowflake = _Snowflake;

    // eslint-disable-next-line @typescript-eslint/ban-types
    type ClassOf<T> = Function & { prototype: T; };
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

    type Mutable<T> = { -readonly [P in keyof T]: T[P] }
    // eslint-disable-next-line @typescript-eslint/ban-types
    type DeepMutable<T> = T extends Exclude<Primitive, object> ? T : { -readonly [P in keyof T]: DeepMutable<T[P]>; };
    type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

    interface ObjectConstructor {
        keys<T>(value: Exclude<T, undefined | null>): Array<string & keyof T>;
        values<T>(value: Exclude<T, undefined | null>): Array<T[keyof T]>;
        entries<T>(value: Exclude<T, undefined | null>): Array<[string & keyof T, T[string & keyof T]]>;
        // eslint-disable-next-line @typescript-eslint/ban-types
        create<T extends object>(value: T): T;
        fromEntries<TKey extends PropertyKey, TValue>(entries: Iterable<readonly [TKey, TValue]>): Record<TKey, TValue>;
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

    type Awaitable<T> = T | PromiseLike<T>;
    type Awaited<T> = T extends PromiseLike<infer R> ? Awaited<R> : T;
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
    }

    function setTimeout<TArgs extends unknown[]>(callback: (...args: TArgs) => void, ms: number, ...args: TArgs): NodeJS.Timeout;
}
