import { BaseBotVariable } from './BaseBotVariable';

export interface WhitelistedDomainsBotVariable extends BaseBotVariable<'whitelistedDomains'> {
    readonly values: { readonly [domain: string]: boolean; };
}
