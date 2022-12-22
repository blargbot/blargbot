import { createParamHelper, defaultMaxSize, RequiredSingleParameter } from '@bbtag/subtag';

import type { FloatArgumentReaderOptions } from '../parameters/FloatArgumentReader.js';
import { FloatArgumentReader } from '../parameters/FloatArgumentReader.js';
import type { IntArgumentReaderOptions } from '../parameters/IntArgumentReader.js';
import { IntArgumentReader } from '../parameters/IntArgumentReader.js';

export const p = createParamHelper({
    int: (name: string, options?: Partial<IntArgumentReaderOptions>) => new RequiredSingleParameter(new IntArgumentReader(name, {
        maxSize: defaultMaxSize,
        radix: 10,
        ...options
    })),
    float: (name: string, options?: Partial<FloatArgumentReaderOptions>) => new RequiredSingleParameter(new FloatArgumentReader(name, {
        maxSize: defaultMaxSize,
        ...options
    }))
});
