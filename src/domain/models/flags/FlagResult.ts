import { FlagResultValueSet } from './FlagResultValueSet';

type FlagResultBase = { readonly [P in Letter]?: FlagResultValueSet }
export interface FlagResult extends FlagResultBase {
    readonly _: FlagResultValueSet;
}
