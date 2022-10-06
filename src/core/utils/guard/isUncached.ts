import { Uncached } from 'eris';

export function isUncached<T extends { readonly id: string; }>(value: T | Uncached | null | undefined): value is Uncached {
    return value?.constructor === Object && Object.keys(value).length === 1 && `id` in value;
}
