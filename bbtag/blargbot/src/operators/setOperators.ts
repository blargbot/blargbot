export type SetOperator = keyof typeof setOperators;

export const setOperators = {
    startswith: (a, b) => typeof a === 'string' ? a.startsWith(b) : a[0] === b,
    endswith: (a, b) => typeof a === 'string' ? a.endsWith(b) : a[a.length - 1] === b,
    contains: (a, b) => a.includes(b),
    includes: (a, b) => a.includes(b)
} as const satisfies Record<string, (a: string | string[], b: string) => boolean>;

export function isSetOperator(operator: string): operator is SetOperator {
    return Object.prototype.hasOwnProperty.call(setOperators, operator);
}
