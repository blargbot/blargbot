import { FlagResultValueSet } from './FlagResultValueSet';

type FlagResultBase = { readonly [P in Alphanumeric]?: FlagResultValueSet }
export interface FlagResult extends FlagResultBase {
    readonly _: FlagResultValueSet;
}
