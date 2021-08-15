import { Snowflake as _Snowflake } from 'catflake';

declare global {
    // eslint-disable-next-line @typescript-eslint/ban-types
    export type Primitive = string | number | bigint | boolean | object | Function | symbol | undefined;
    export type JToken = JObject | JArray | JValue | null | undefined;
    export type JValue = string | number | boolean;
    export type JObject = { [key: string]: JToken; };
    export type JArray = JToken[];
    export type JTokenType = keyof JTokenTypeMap;
    export type JTokenTypeMap = {
        'string': string;
        'number': number;
        'boolean': boolean;
        'undefined': undefined;
        'null': null;
        'array': JArray;
        'object': JObject;
    }

    export type Configuration = typeof import('@config')
    export type Snowflake = _Snowflake;

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type ClassOf<T> = Function & { prototype: T; };

    type LowerLetter = Lowercase<'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j' | 'k' | 'l' | 'm' | 'n' | 'o' | 'p' | 'q' | 'r' | 's' | 't' | 'u' | 'v' | 'w' | 'x' | 'y' | 'z'>;
    type UpperLetter = Uppercase<LowerLetter>;
    type Letter = LowerLetter | UpperLetter;
    type Numeric = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
    type Alphanumeric = Letter | Numeric;

    type Mutable<T> = { -readonly [P in keyof T]: T[P] }
    type FilteredKeys<T, U> = { [P in keyof T]: T[P] extends U ? P : never }[keyof T];

    interface ObjectConstructor {
        keys<T>(value: T): Array<string & keyof T>;
        values<T>(value: T): Array<T[(string | number) & keyof T]>;
        entries<TKey extends PropertyKey, TValue>(value: { [P in TKey]: TValue; }): Array<[string & TKey, TValue]>;
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
        includes<R>(this: T extends R ? this : never, value: R): value is T & R;
    }

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
