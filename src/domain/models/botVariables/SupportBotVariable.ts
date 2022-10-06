import { BaseBotVariable } from './BaseBotVariable';

export interface SupportBotVariable extends BaseBotVariable<`support`> {
    readonly value: readonly string[];
}
