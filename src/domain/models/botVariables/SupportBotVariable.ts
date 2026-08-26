import type { BaseBotVariable } from './BaseBotVariable.js';

export interface SupportBotVariable extends BaseBotVariable<'support'> {
    readonly value: readonly string[];
}
