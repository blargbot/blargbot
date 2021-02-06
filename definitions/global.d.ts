import configJson from '../config.json';
import CatLoggr from 'cat-loggr/ts';
import { createLogger } from '../src/workers/images/Logger';
import { User } from 'eris';

declare global {
    export type JToken = JObject | JArray | JValue | null | undefined;
    export type JValue = string | number | boolean;
    export type JObject = { [key: string]: JToken };
    export type JArray = Array<JToken>;

    export type Configuration = typeof configJson;
    export type CatLogger = CatLoggr;
    export type WorkerLogger = ReturnType<typeof createLogger>;

    export type ClassOf<T> = Function & { prototype: T };

    namespace NodeJS {
        interface Process {
            kill(): true;
        }
    }
}
