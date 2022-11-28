import { Statement } from '../language';
import { SubtagSignatureValueParameter } from '../types';

export interface SubtagArgument {
    readonly parameter: SubtagSignatureValueParameter;
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}
