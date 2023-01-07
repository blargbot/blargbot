import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const arrayResultAdapter = {
    async *execute(value) {
        const result = await value;
        return JSON.stringify(Array.isArray(result) ? result : [...result]);
    }
} satisfies SubtagResultAdapter<Awaitable<Iterable<unknown>>>;
