import { BaseBotVariable } from './BaseBotVariable.js';

export interface AutoresponseBotVariable extends BaseBotVariable<'arwhitelist'> {
    readonly values: readonly string[];
}
