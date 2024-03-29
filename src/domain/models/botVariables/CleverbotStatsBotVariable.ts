import { BaseBotVariable } from './BaseBotVariable';

export interface CleverbotStateBotVariable extends BaseBotVariable<'cleverstats'> {
    readonly stats: { readonly [date: string]: { readonly uses: number; }; };
}
