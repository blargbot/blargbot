import { BaseBotVariable } from './BaseBotVariable';

export interface AutoresponseBotVariable extends BaseBotVariable<`arwhitelist`> {
    readonly values: readonly string[];
}
