import { Statement } from '../types';

export interface SubtagArgumentValue {
    readonly isCached: boolean;
    readonly value: string;
    readonly code: Statement;
    readonly raw: string;
    wait(): Promise<string>;
    execute(): Promise<string>;
}
