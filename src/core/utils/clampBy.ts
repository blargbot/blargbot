import { clamp } from './clamp.js';

export function clampBy<T>(value: T, min: T, max: T, valueOf: (value: T) => number | string | bigint): T {
    const minVal = valueOf(min);
    const maxVal = valueOf(max);
    const val = valueOf(value);

    const clampedVal = clamp(val, minVal, maxVal);
    if (clampedVal === val)
        return value;
    if (clampedVal === minVal)
        return min;
    return max;
}
