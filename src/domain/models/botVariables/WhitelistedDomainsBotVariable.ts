import type { BaseBotVariable } from './BaseBotVariable.js';

export interface WhitelistedDomainsBotVariable extends BaseBotVariable<'whitelistedDomains'> {
    readonly values: { readonly [domain: string]: boolean; };
}
