import { BaseBotVariable } from './BaseBotVariable';

export interface PGDonationBotVariable extends BaseBotVariable<'pg'> {
    readonly value: number;
}
