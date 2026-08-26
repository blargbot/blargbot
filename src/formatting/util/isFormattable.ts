import type { IFormattable } from '../types.js';
import { format } from '../types.js';

export function isFormattable(value: unknown): value is IFormattable<unknown> {
    return typeof value === 'object'
        && value !== null
        && format in value
        && typeof (value as { [format]: unknown; })[format] === 'function';
}
