import { data } from './data.js';

export const colorMap: { [P in keyof typeof data]: number } = Object.fromEntries(
    Object.entries(data)
        .map(x => [x[0], parseInt(x[1].slice(1), 16)])
);
