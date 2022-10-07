import { IFormatString } from '../../messages/types';

export interface FlagDefinition {
    readonly flag: Alphanumeric;
    readonly word: string;
    readonly description: IFormatString;
}

export interface InvariantFlagDefinition {
    readonly flag: Alphanumeric;
    readonly word: string;
    readonly description: string;
}
