import type * as Eris from 'eris';

export function isUncached<T extends object>(value: T | Eris.Uncached | undefined | null): value is Eris.Uncached {
    return value?.constructor === Object && Object.keys(value).length === 1 && 'id' in value;
}
