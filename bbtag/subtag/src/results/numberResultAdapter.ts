import type { SubtagResultAdapter } from './SubtagResultAdapter.js';

export const numberResultAdapter = {
    * execute(value) {
        return value.toString();
    }
} satisfies SubtagResultAdapter<number>;
