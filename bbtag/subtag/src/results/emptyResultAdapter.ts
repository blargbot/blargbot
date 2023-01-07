import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const emptyResultAdapter = {
    *execute() {
        return '';
    }
} satisfies SubtagResultAdapter<void>;
