import { parseBBTag } from '../language/parseBBTag';
import { createDebugOutput } from './debugOutput';
import { json } from './json';
import * as operators from './operators';
import { overrides } from './overrides';
import { stringify } from './stringify';
import { stringifyParameters } from './stringifyParameters';
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
    stringifyParameters,
    tagArray,
    overrides
});
