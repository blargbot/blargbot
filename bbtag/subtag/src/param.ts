import type { BBTagPluginType, InterruptableAsyncProcess } from '@bbtag/engine';

import { BBTagPluginParameter } from './parameter/BBTagPluginParameter.js';
import { BBTagScriptParameter } from './parameter/BBTagScriptParameter.js';
import { ConstParameter } from './parameter/ConstParameter.js';
import { FallbackParameter } from './parameter/FallbackParameter.js';
import { RequiredSubtagParameter } from './parameter/RequiredSubtagParameter.js';
import { SubtagNameParameter } from './parameter/SubtagNameParameter.js';
import { SubtagParameterGroup } from './parameter/SubtagParameterGroup.js';
import type { DeferredParameterItemOptions } from './readers/DeferredArgumentReader.js';
import { DeferredArgumentReader } from './readers/DeferredArgumentReader.js';
import type { JsonArgumentReaderOptions } from './readers/JsonArgumentReader.js';
import { JsonArgumentReader } from './readers/JsonArgumentReader.js';
import type { OneOfArgumentReaderOptions } from './readers/OneOfArgumentReader.js';
import { OneOfArgumentReader } from './readers/OneOfArgumentReader.js';
import type { RawArgumentReaderOptions } from './readers/RawArgumentReader.js';
import { RawArgumentReader } from './readers/RawArgumentReader.js';
import type { StringArgumentReaderOptions } from './readers/StringArgumentReader.js';
import { StringArgumentReader } from './readers/StringArgumentReader.js';
import type { SubtagArgumentReaderProvider, SubtagArgumentReaderTypes } from './readers/SubtagArgumentReader.js';

export let defaultMaxSize = 1_000_000;

export function setDefaultMaxArgLength(value: number): void {
    defaultMaxSize = value;
}

export function createParamHelper<T extends object>(value: T): SubtagParamHelper<T> {
    return Object.assign({ ...param }, value) as SubtagParamHelper<T>;
}

export type SubtagParamHelper<T> = Exclude<typeof param, keyof T> & T;

const param = {
    script: new BBTagScriptParameter(),
    name: new SubtagNameParameter(),
    fallback: new FallbackParameter(),
    plugin: <Type extends BBTagPluginType>(type: Type) => new BBTagPluginParameter(type),

    deferred: createDeferred,
    group: createGroup,
    const: <T>(value: T) => new ConstParameter(value),
    raw: (name: string, options?: Partial<RawArgumentReaderOptions>) => new RequiredSubtagParameter(new RawArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    string: (name: string, options?: Partial<StringArgumentReaderOptions>) => new RequiredSubtagParameter(new StringArgumentReader(name, {
        maxSize: defaultMaxSize,
        ifEmpty: '',
        ...options
    })),
    json: <T>(name: string, reader: (value: string) => { valid: true; value: T; } | { valid: false; }, options?: Partial<JsonArgumentReaderOptions>) => new RequiredSubtagParameter(new JsonArgumentReader(name, reader, {
        maxSize: defaultMaxSize,
        ...options
    })),
    oneOf: <T extends readonly string[]>(name: string, choices: T, error: string, options?: Partial<OneOfArgumentReaderOptions>) => new RequiredSubtagParameter(new OneOfArgumentReader(name, choices, error, {
        maxSize: defaultMaxSize,
        caseSensitive: true,
        ...options
    }))
};

function createDeferred(name: string, options?: Partial<DeferredParameterItemOptions<() => InterruptableAsyncProcess<string>>>): RequiredSubtagParameter<() => InterruptableAsyncProcess<string>>;
function createDeferred<R>(name: string, reader: (value: InterruptableAsyncProcess<string>) => R, options?: Partial<DeferredParameterItemOptions<() => R>>): RequiredSubtagParameter<() => R>;
function createDeferred<R>(name: string, ...args: [reader: (value: InterruptableAsyncProcess<string>) => R, options?: Partial<DeferredParameterItemOptions<() => R>>] | [options?: Partial<DeferredParameterItemOptions<() => R>>]): RequiredSubtagParameter<() => R> {
    const [reader, options] = typeof args[0] === 'function' ? [args[0], args[1]] : [(v: unknown) => v as R, args[0]];
    return new RequiredSubtagParameter(new DeferredArgumentReader<R>(name, {
        maxSize: defaultMaxSize,
        ...options,
        read: reader
    }));
}

function createGroup<Items extends readonly SubtagArgumentReaderProvider[]>(...items: Items): SubtagParameterGroup<SubtagArgumentReaderTypes<Items>>;
function createGroup(...items: SubtagArgumentReaderProvider[]): SubtagParameterGroup<unknown[]> {
    return new SubtagParameterGroup(items.map(x => x.reader));
}

export function deferredValue<T>(value: Awaitable<T>): () => () => InterruptableAsyncProcess<T> {
    return () => async function* () {
        return await value;
    };
}
