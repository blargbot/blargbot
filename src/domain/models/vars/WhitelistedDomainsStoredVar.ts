import { BaseStoredVar } from './BaseStoredVar';

export interface WhitelistedDomainsStoredVar extends BaseStoredVar<'whitelistedDomains'> {
    readonly values: { readonly [domain: string]: boolean; };
}
