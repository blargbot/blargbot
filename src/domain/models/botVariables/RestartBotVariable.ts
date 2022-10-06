import { BaseBotVariable } from './BaseBotVariable';

export interface RestartBotVariable extends BaseBotVariable<`restart`> {
    readonly varvalue: {
        readonly channel: string;
        readonly time: number;
    };
}
