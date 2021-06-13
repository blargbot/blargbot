import * as tagArray from './tagArray';
import { parse } from './parse';
import { stringify } from './stringify';
import { stringifyAnalysis } from './stringifyAnalysis';
import { stringifyLocation } from './stringifyLocation';
import { stringifyRange } from './stringifyRange';
import { stringifyArguments } from './stringifyArguments';
import { default as allOperators, operatorTypes as operators} from './operators';

export const bbtagUtil = {
    tagArray,
    parse,
    stringify,
    stringifyAnalysis,
    stringifyLocation,
    stringifyRange,
    stringifyArguments,
    operators,
    allOperators
};