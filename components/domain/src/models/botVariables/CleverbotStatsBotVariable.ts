import type { BaseBotVariable } from './BaseBotVariable.js';

export interface CleverbotStateBotVariable extends BaseBotVariable<'cleverstats'> {
    readonly stats: { readonly [date: string]: { readonly uses: number; }; };
}
