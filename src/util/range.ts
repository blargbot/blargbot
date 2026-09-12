export function range(end: number): Generator<number, void, void>;
export function range(start: number, end: number, step?: number): Generator<number, void, void>
export function range(start: number, end?: number, step?: number): Generator<number, void, void> {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    if (step === 0)
        throw new RangeError('Step cannot be 0');

    step ??= Math.sign(end - start);
    if (step === 0)
        return rangeImpl(0, 0, 0);

    if (Math.sign(step) !== Math.sign(end - start))
        throw new RangeError('Step must operate in the direction from start to end.');

    return rangeImpl(start, end, step);
}

function* rangeImpl(start: number, end: number, step: number): Generator<number, void, void> {
    if (step < 0) {
        for (let x = start; x > end; x += step)
            yield x;
    } else {
        for (let x = start; x < end; x += step)
            yield x;
    }
}
