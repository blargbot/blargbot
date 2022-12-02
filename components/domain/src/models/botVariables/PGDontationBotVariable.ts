import { BaseBotVariable } from './BaseBotVariable.js';

export interface PGDonationBotVariable extends BaseBotVariable<'pg'> {
    readonly value: number;
}
