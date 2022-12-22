import type { BBTagPluginType, InterruptableAsyncProcess } from '@bbtag/engine';
import { processResult } from '@bbtag/engine';

import { BBTagPluginParameter } from './parameter/BBTagPluginParameter.js';
import { BBTagScriptParameter } from './parameter/BBTagScriptParameter.js';
import { RequiredAggregatedParameter } from './parameter/RequiredAggregatedParameter.js';
import { RequiredSingleParameter } from './parameter/RequiredSingleParameter.js';
import { SubtagNameParameter } from './parameter/SubtagNameParameter.js';
import type { DeferredParameterItemOptions } from './readers/DeferredArgumentReader.js';
import { DeferredArgumentReader } from './readers/DeferredArgumentReader.js';
import type { RawParameterItemOptions } from './readers/RawArgumentReader.js';
import { RawArgumentReader } from './readers/RawArgumentReader.js';
import type { StringParameterItemOptions } from './readers/StringArgumentReader.js';
import { StringArgumentReader } from './readers/StringArgumentReader.js';
import type { SubtagArgumentReader, SubtagArgumentReaderTypes } from './readers/SubtagArgumentReader.js';

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
    plugin: <Type extends BBTagPluginType>(type: Type) => new BBTagPluginParameter(type),

    deferred: createDeferred,
    group: createGroup,
    raw: (name: string, options?: Partial<RawParameterItemOptions>) => new RequiredSingleParameter(new RawArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    string: (name: string, options?: Partial<StringParameterItemOptions>) => new RequiredSingleParameter(new StringArgumentReader(name, {
        maxSize: defaultMaxSize,
        ifEmpty: '',
        ...options
    }))
};

function createDeferred(name: string, options?: Partial<DeferredParameterItemOptions<() => InterruptableAsyncProcess<string>>>): RequiredSingleParameter<() => InterruptableAsyncProcess<string>>;
function createDeferred<R>(name: string, reader: (value: InterruptableAsyncProcess<string>) => R, options?: Partial<DeferredParameterItemOptions<() => R>>): RequiredSingleParameter<() => R>;
function createDeferred(name: string, ...args: [reader: (value: InterruptableAsyncProcess<string>) => unknown, options?: Partial<DeferredParameterItemOptions<() => unknown>>] | [options?: Partial<DeferredParameterItemOptions<() => unknown>>]): RequiredSingleParameter<() => unknown> {
    const [reader, options] = typeof args[0] === 'function' ? [args[0], args[1]] : [(v: unknown) => v, args[0]];
    return new RequiredSingleParameter(new DeferredArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options,
        read: reader
    }));
}

function createGroup<Items extends readonly SubtagArgumentReader[]>(...items: Items): RequiredAggregatedParameter<SubtagArgumentReaderTypes<Items>, SubtagArgumentReaderTypes<Items>>
function createGroup(...items: SubtagArgumentReader[]): RequiredAggregatedParameter<unknown[], unknown[]> {
    return new RequiredAggregatedParameter(items, v => processResult(v));
}
