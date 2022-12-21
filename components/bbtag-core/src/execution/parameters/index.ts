import { NumberPlugin } from '../../plugins/NumberPlugin.js';
import type { BBTagScript } from '../../runtime/BBTagScript.js';
import type { InterruptableProcess } from '../../runtime/InterruptableProcess.js';
import { processResult } from '../../runtime/processResult.js';
import type { SubtagParameter } from '../SubtagParameter.js';
import OptionalParsedParameter from './parsed/OptionalParsedParameter.js';
import ParsedArrayParameter from './parsed/ParsedArrayParameter.js';
import ParsedParameter from './parsed/ParsedParameter.js';
import OptionalStringParameter from './string/OptionalStringParameter.js';
import StringArrayParameter from './string/StringArrayParameter.js';
import StringParameter from './string/StringParameter.js';

export const defaultMaxSize = 1_000_000;

export const subtagParameter = {
    string: Object.assign((name: string, options?: BaseOptions) => {
        return new StringParameter(name, options?.maxSize ?? defaultMaxSize);
    }, {
        array(name: string, options?: BaseArrayOptions) {
            return new StringArrayParameter(name, options?.minLength ?? 1, options?.maxLength ?? Infinity, options?.maxSize ?? defaultMaxSize);
        },
        optional(name: string, options?: BaseOptionalOptions) {
            return new OptionalStringParameter<undefined>(name, options?.fallback, options?.maxSize ?? defaultMaxSize);
        }
    }) as SubtagParameterFactory<string, BaseOptions>,
    number: createParsedSubtagParameterFactory(function parseAsNumber(value, script) {
        const parser = script.process.plugins.get(NumberPlugin);
        return processResult(parser.parseFloat(value));
    })
};

function createParsedSubtagParameterFactory<T, Options extends BaseOptions>(parse: (value: string, script: BBTagScript, options?: Options) => InterruptableProcess<T>): SubtagParameterFactory<T, Options> {
    return Object.assign((name: string, options?: Options) => {
        return new ParsedParameter(
            name,
            (value, script) => parse(value, script, options),
            options?.maxSize ?? defaultMaxSize
        );
    }, {
        array(name: string, options?: Options & BaseArrayOptions) {
            return new ParsedArrayParameter(
                name,
                (value, script) => parse(value, script, options),
                options?.minLength ?? 1,
                options?.maxLength ?? Infinity,
                options?.maxSize ?? defaultMaxSize
            );
        },
        optional(name: string, options?: Options & BaseOptionalOptions) {
            return new OptionalParsedParameter<T, unknown>(
                name,
                (value, script) => parse(value, script, options),
                options?.fallback,
                options?.maxSize ?? defaultMaxSize
            );
        }
    }) as SubtagParameterFactory<T, Options>;
}

export interface BaseOptions {
    readonly maxSize?: number;
}

export interface BaseArrayOptions extends BaseOptions {
    readonly minLength?: number;
    readonly maxLength?: number;
}

export interface BaseOptionalOptions extends BaseOptions {
    readonly fallback?: undefined;
}

export interface BaseDefaultOptions<F> extends BaseOptions {
    readonly fallback: F;
}

export interface SubtagParameterFactory<T, Options> {
    (name: string, options?: Options): SubtagParameter<T>;
    array(name: string, options?: Options & BaseArrayOptions): SubtagParameter<T[]>;
    optional(name: string, options?: Options & BaseOptionalOptions): SubtagParameter<T | undefined>;
    optional<F>(name: string, options: Options & BaseDefaultOptions<F>): SubtagParameter<T | F>;
}
