import { createMapping } from './createMapping';
import { result } from './result';
import { TypeMapping } from './types';

export function mapTypeof<T extends keyof TypeofMapping>(typeofStr: T): TypeMapping<TypeofMapping[T]> {
    return createMapping(v => {
        if (typeof v === typeofStr)
            return result.success(v as TypeofMapping[T]);
        return result.failed;
    });
}

export type TypeofMapping = {
    'string': string;
    'number': number;
    'boolean': boolean;
    'bigint': bigint;
    'symbol': symbol;
    'object': object;
    // eslint-disable-next-line @typescript-eslint/ban-types
    'function': Function;
}
