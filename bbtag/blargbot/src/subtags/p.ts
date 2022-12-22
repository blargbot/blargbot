import { createParamHelper, defaultMaxSize, RequiredSingleParameter } from '@bbtag/subtag';

import type { ArrayArgumentReaderOptions } from '../parameters/ArrayArgumentReader.js';
import { ArrayArgumentReader } from '../parameters/ArrayArgumentReader.js';
import type { FloatArgumentReaderOptions } from '../parameters/FloatArgumentReader.js';
import { FloatArgumentReader } from '../parameters/FloatArgumentReader.js';
import type { IntArgumentReaderOptions } from '../parameters/IntArgumentReader.js';
import { IntArgumentReader } from '../parameters/IntArgumentReader.js';
import type { RegexArgumentReaderOptions } from '../parameters/RegexArgumentReader.js';
import { RegexArgumentReader } from '../parameters/RegexArgumentReader.js';

export const p = createParamHelper({
    int: (name: string, options?: Partial<IntArgumentReaderOptions>) => new RequiredSingleParameter(new IntArgumentReader(name, {
        maxSize: defaultMaxSize,
        radix: 10,
        ...options
    })),
    float: (name: string, options?: Partial<FloatArgumentReaderOptions>) => new RequiredSingleParameter(new FloatArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    regex: (name: string, options?: Partial<RegexArgumentReaderOptions>) => new RequiredSingleParameter(new RegexArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    })),
    array: (name: string, options?: Partial<ArrayArgumentReaderOptions>) => new RequiredSingleParameter(new ArrayArgumentReader(name, {
        maxSize: defaultMaxSize,
        allowVarName: true,
        ...options
    }))
});
