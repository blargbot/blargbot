import type { BaseBotVariable } from './BaseBotVariable.js';

export interface RestartBotVariable extends BaseBotVariable<'restart'> {
    readonly varvalue: {
        readonly channel: string;
        readonly time: number;
    };
}
