import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const stringResultAdapter = {
    async *execute(value) {
        return await value;
    }
} satisfies SubtagResultAdapter<Awaitable<string>>;

export function optionalStringResultAdapter(fallback = ''): SubtagResultAdapter<Awaitable<string | undefined | null>> {
    return {
        async *execute(value) {
            return await value ?? fallback;
        }
    };
}
