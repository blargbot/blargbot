import { format, IFormattable } from '../types';

export function literal<T>(value: Exclude<T, undefined>): IFormattable<T>;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined;
export function literal<T>(value: T | undefined): IFormattable<T> | undefined {
    if (value === undefined)
        return undefined;
    return {
        [format]() {
            return value;
        }
    };
}
