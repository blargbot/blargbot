import { FlagResultValue } from './FlagResultValue.js';

export interface FlagResultValueSet {
    merge(start?: number, end?: number): FlagResultValue;
    length: number;
    get(index: number): FlagResultValue | undefined;
    slice(start: number, end?: number): FlagResultValueSet;
    map<T>(mapFn: (value: FlagResultValue) => T): T[];
    toArray(): FlagResultValue[];
}
