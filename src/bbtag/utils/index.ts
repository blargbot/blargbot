import { parseBBTag } from '../language/parseBBTag.js';
import { createDebugOutput } from './debugOutput.js';
import { json } from './json.js';
import * as operators from './operators.js';
import { overrides } from './overrides.js';
import { stringify } from './stringify.js';
import { stringifyParameters } from './stringifyParameters.js';
import { tagArray } from './tagArray.js';

export { ComparisonOperator, LogicOperator, NumericOperator, OrdinalOperator, StringOperator } from './operators.js';
export { JsonResolveResult } from './json.js';
export * from './subtagType.js';
export * from './subtagArgumentKind.js';

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
