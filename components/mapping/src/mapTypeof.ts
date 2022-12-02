import { createMapping } from './createMapping.js';
import { result } from './result.js';
import { TypeMapping } from './types.js';

export function mapTypeof<T extends keyof TypeofMapping>(typeofStr: T): TypeMapping<TypeofMapping[T]> {
    return createMapping(v => {
        if (v === undefined || v === null || typeof v !== typeofStr)
            return result.failed;
        return result.success(v as TypeofMapping[T]);
    });
}

export type TypeofMapping = {
    string: string;
    number: number;
    boolean: boolean;
    bigint: bigint;
    symbol: symbol;
    object: object;
    // eslint-disable-next-line @typescript-eslint/ban-types
    function: Function;
}
