export function range(count: number): Generator<number, void, void>;
export function range(start: number, count: number, step?: number): Generator<number, void, void>
export function range(start: number, count?: number, step?: number): Generator<number, void, void> {
    if (count === undefined) {
        count = start;
        start = 0;
    }

    step ??= 1;
    if (step === 0)
        throw new RangeError('Step cannot be zero');

    return rangeImpl(start, count, step);
}

function* rangeImpl(start: number, count: number, step: number): Generator<number, void, void> {
    for (let i = 0; i < count; i++) {
        yield start;
        start += step;
    }
}
