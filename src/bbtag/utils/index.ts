import { createDebugOutput } from './debugOutput';
import { json } from './json';
import * as operators from './operators';
import { overrides } from './overrides';
import { parseBBTag } from './parseBBTag';
import { stringify } from './stringify';
import { stringifyAnalysis } from './stringifyAnalysis';
import { stringifyLocation } from './stringifyLocation';
import { stringifyParameters } from './stringifyParameters';
import { stringifyRange } from './stringifyRange';
import { tagArray } from './tagArray';

export { ComparisonOperator, LogicOperator, NumericOperator, OrdinalOperator, StringOperator } from './operators';
export { JsonResolveResult } from './json';
export * from './subtagType';
export * from './subtagArgumentKind';

export const bbtag = Object.freeze({
    createDebugOutput,
    json,
    ...operators,
    parse: parseBBTag,
    stringify,
    stringifyAnalysis,
    stringifyLocation,
    stringifyParameters,
    stringifyRange,
    tagArray,
    overrides
});
