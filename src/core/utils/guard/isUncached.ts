import type * as eris from 'eris';

export function isUncached<T extends { readonly id: string; }>(value: T | eris.Uncached | null | undefined): value is eris.Uncached {
    return value?.constructor === Object && Object.keys(value).length === 1 && 'id' in value;
}
