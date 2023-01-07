import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const booleanResultAdapter = {
    *execute(value) {
        return value.toString();
    }
} satisfies SubtagResultAdapter<boolean>;
