import type { BBTagPluginType } from '../../plugins/BBTagPluginType.js';
import type { InterruptableAsyncProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagParameterItem, SubtagParameterItemTypes } from '../SubtagParameter.js';
import { RequiredAggregatedParameter } from './aggregators/RequiredAggregatedParameter.js';
import { RequiredSingleParameter } from './aggregators/RequiredSingleParameter.js';
import { BBTagPluginParameter } from './BBTagPluginParameter.js';
import { BBTagScriptParameter } from './BBTagScriptParameter.js';
import type { DeferredParameterItemOptions } from './items/DeferredParameterItem.js';
import { DeferredParameterItem } from './items/DeferredParameterItem.js';
import type { FloatParameterItemOptions } from './items/FloatParameterItem.js';
import { FloatParameterItem } from './items/FloatParameterItem.js';
import type { IntParameterItemOptions } from './items/IntParameterItem.js';
import { IntParameterItem } from './items/IntParameterItem.js';
import type { RawParameterItemOptions } from './items/RawParameterItem.js';
import { RawParameterItem } from './items/RawParameterItem.js';
import type { StringParameterItemOptions } from './items/StringParameterItem.js';
import { StringParameterItem } from './items/StringParameterItem.js';
import { SubtagNameParameter } from './SubtagNameParameter.js';

export const defaultMaxSize = 1_000_000;

function createDeferred(name: string, options?: Partial<DeferredParameterItemOptions<() => InterruptableAsyncProcess<string>>>): RequiredSingleParameter<() => InterruptableAsyncProcess<string>>;
function createDeferred<R>(name: string, reader: (value: InterruptableAsyncProcess<string>) => R, options?: Partial<DeferredParameterItemOptions<() => R>>): RequiredSingleParameter<() => R>;
function createDeferred(name: string, ...args: [reader: (value: InterruptableAsyncProcess<string>) => unknown, options?: Partial<DeferredParameterItemOptions<() => unknown>>] | [options?: Partial<DeferredParameterItemOptions<() => unknown>>]): RequiredSingleParameter<() => unknown> {
    const [reader, options] = typeof args[0] === 'function' ? [args[0], args[1]] : [(v: unknown) => v, args[0]];
    return new RequiredSingleParameter(new DeferredParameterItem(name, {
        maxSize: defaultMaxSize,
        ...options,
        read: reader
    }));
}

function createAggregate<Items extends readonly SubtagParameterItem[]>(...items: Items): RequiredAggregatedParameter<SubtagParameterItemTypes<Items>, SubtagParameterItemTypes<Items>>
function createAggregate(...items: SubtagParameterItem[]): RequiredAggregatedParameter<unknown[], unknown[]> {
    return new RequiredAggregatedParameter(items, v => processResult(v));
}

export const subtagParameter = {
    script: new BBTagScriptParameter(),
    name: new SubtagNameParameter(),
    plugin: <Type extends BBTagPluginType>(type: Type) => new BBTagPluginParameter(type),

    deferred: createDeferred,
    aggregate: createAggregate,
    raw: (name: string, options?: Partial<RawParameterItemOptions>) => new RequiredSingleParameter(new RawParameterItem(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    string: (name: string, options?: Partial<StringParameterItemOptions>) => new RequiredSingleParameter(new StringParameterItem(name, {
        maxSize: defaultMaxSize,
        ifEmpty: '',
        ...options
    })),
    int: (name: string, options?: Partial<IntParameterItemOptions>) => new RequiredSingleParameter(new IntParameterItem(name, {
        maxSize: defaultMaxSize,
        radix: 10,
        ...options
    })),
    float: (name: string, options?: Partial<FloatParameterItemOptions>) => new RequiredSingleParameter(new FloatParameterItem(name, {
        maxSize: defaultMaxSize,
        ...options
    }))
};
