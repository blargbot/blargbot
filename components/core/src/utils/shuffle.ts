import { randomInt } from 'node:crypto';

export function shuffle(array: unknown[]): void {
    // Swap each position in the array with another random position
    for (let i = 0; i < array.length; i++) {
        const j = randomInt(array.length);
        [array[i], array[j]] = [array[j], array[i]];
    }
}
