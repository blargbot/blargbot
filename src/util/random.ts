import type { IterableObject } from './Iterable.js';
import { Iterable } from './Iterable.js';

export const random = {
    /** Returns a new shuffled array which contains all the elements */
    shuffle<T>(items: Iterable<T>): T[] {
        const options = [...items];
        random.ishuffle(options);
        return options;
    },
    /** Shuffles the array in place */
    ishuffle<T>(items: T[]): void {
        for (let i = items.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const swap = items[i];
            items[i] = items[j];
            items[j] = swap;
        }
    },
    /** Indefinitely yields random elements from the source */
    stream<T>(source: Iterable<T>): IterableObject<T> {
        return Iterable.from(function* stream() {
            const options = [...source];
            while (true)
                yield options[random.int(0, options.length, false)];
        });
    },
    /** Picks a single random element from the source. */
    pick<T>(source: Iterable<T>): T {
        for (const item of random.stream(source))
            return item;
        throw new Error('Source was empty.');
    },
    /** Picks a random number in the range [min, max], or [min, max) if upperInclusive is set to false */
    int(min: number, max: number, upperInclusive = true): number {
        return Math.floor(Math.random() * (max - min + (upperInclusive ? 1 : 0))) + min;
    }
};
