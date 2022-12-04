import type { BaseBotVariable } from './BaseBotVariable.js';

export interface PoliceBotVariable extends BaseBotVariable<'police'> {
    readonly value: readonly string[];
}
