import configJson from '../config.json';
import { Snowflake as _Snowflake } from 'catflake';

declare global {

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

    export type Configuration = typeof configJson;
    export type Snowflake = _Snowflake;

    // eslint-disable-next-line @typescript-eslint/ban-types
    export type ClassOf<T> = Function & { prototype: T; };

    type Mutable<T> = { -readonly [P in keyof T]: T[P] }

    interface ObjectConstructor {
        keys<T>(value: T): Array<string & keyof T>;
        // eslint-disable-next-line @typescript-eslint/ban-types
        create<T extends object>(value: T): T;
    }

    interface JSON {
        parse(text: string): JToken;
    }

    namespace NodeJS {
        type WorkerProcess = Process & Required<Pick<Process, 'send'>>;

        interface Process {
            kill(): true;
        }
    }

    function setTimeout<TArgs extends unknown[]>(callback: (...args: TArgs) => void, ms: number, ...args: TArgs): NodeJS.Timeout;
}
