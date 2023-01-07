import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const stringResultAdapter = {
    async *execute(value) {
        return await value;
    }
} satisfies SubtagResultAdapter<Awaitable<string>>;
