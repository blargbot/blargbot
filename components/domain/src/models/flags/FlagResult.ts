import { FlagResultValueSet } from './FlagResultValueSet.js';

type FlagResultBase = { readonly [P in Alphanumeric]?: FlagResultValueSet }
export interface FlagResult extends FlagResultBase {
    readonly _: FlagResultValueSet;
}
