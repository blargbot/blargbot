import type { SubtagArgumentReader } from '@bbtag/subtag';
import { createParamHelper, defaultMaxSize, OptionalSubtagParameter, RequiredSubtagParameter } from '@bbtag/subtag';

import type { ArrayArgumentReaderOptions } from '../parameters/ArrayArgumentReader.js';
import { ArrayArgumentReader } from '../parameters/ArrayArgumentReader.js';
import type { BooleanArgumentReaderOptions } from '../parameters/BooleanArgumentReader.js';
import { BooleanArgumentReader } from '../parameters/BooleanArgumentReader.js';
import type { FloatArgumentReaderOptions } from '../parameters/FloatArgumentReader.js';
import { FloatArgumentReader } from '../parameters/FloatArgumentReader.js';
import type { IntArgumentReaderOptions } from '../parameters/IntArgumentReader.js';
import { IntArgumentReader } from '../parameters/IntArgumentReader.js';
import type { RegexArgumentReaderOptions } from '../parameters/RegexArgumentReader.js';
import { RegexArgumentReader } from '../parameters/RegexArgumentReader.js';
import { QuietPlugin } from '../plugins/QuietPlugin.js';

export const p = createParamHelper({
    int: (name: string, options?: Partial<IntArgumentReaderOptions>) => new RequiredSubtagParameter(new IntArgumentReader(name, {
        maxSize: defaultMaxSize,
        radix: 10,
        ...options
    })),
    float: (name: string, options?: Partial<FloatArgumentReaderOptions>) => new RequiredSubtagParameter(new FloatArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    boolean: (name: string, options?: Partial<BooleanArgumentReaderOptions>) => new RequiredSubtagParameter(new BooleanArgumentReader(name, {
        maxSize: defaultMaxSize,
        allowNumbers: true,
        ...options
    })),
    regex: (name: string, options?: Partial<RegexArgumentReaderOptions>) => new RequiredSubtagParameter(new RegexArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    array: (name: string, options?: Partial<ArrayArgumentReaderOptions>) => new RequiredSubtagParameter(new ArrayArgumentReader(name, {
        maxSize: defaultMaxSize,
        allowVarName: true,
        ...options
    })),
    quiet: new OptionalSubtagParameter({
        name: 'quiet',
        maxSize: defaultMaxSize,
        async * read(_name, arg, script) {
            const value = yield* arg.value(this.maxSize);
            return value.length !== 0 || (script.process.plugins.tryGet(QuietPlugin)?.isQuiet ?? false);
        },
        get reader() {
            return this;
        }
    } as SubtagArgumentReader<boolean>, () => false)
});
