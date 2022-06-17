import { BaseBotVariable } from './BaseBotVariable';

export interface VersionBotVariable extends BaseBotVariable<'version'> {
    readonly major: number;
    readonly minor: number;
    readonly patch: number;
    readonly build?: string | null;
    readonly preRelease?: string | null;
}
