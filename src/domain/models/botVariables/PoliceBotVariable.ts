import { BaseBotVariable } from './BaseBotVariable';

export interface PoliceBotVariable extends BaseBotVariable<`police`> {
    readonly value: readonly string[];
}
