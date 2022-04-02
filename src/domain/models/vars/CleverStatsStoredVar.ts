import { BaseStoredVar } from './BaseStoredVar';

export interface CleverStatsStoredVar extends BaseStoredVar<'cleverstats'> {
    readonly stats: { readonly [date: string]: { readonly uses: number; }; };
}
