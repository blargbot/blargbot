import * as Eris from 'eris';

export function isUncached<T extends { readonly id: string; }>(value: T | Eris.Uncached | null | undefined): value is Eris.Uncached {
    return value?.constructor === Object && Object.keys(value).length === 1 && 'id' in value;
}
