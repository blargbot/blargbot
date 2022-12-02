import { BaseBotVariable } from './BaseBotVariable.js';

export interface SupportBotVariable extends BaseBotVariable<'support'> {
    readonly value: readonly string[];
}
