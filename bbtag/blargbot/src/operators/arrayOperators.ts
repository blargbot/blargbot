export type ArrayOperator = keyof typeof arrayOperators;
export const arrayOperators = {
    startswith: (a, b) => a[0] === b,
    endswith: (a, b) => a[a.length - 1] === b,
    contains: (a, b) => a.includes(b),
    includes: (a, b) => a.includes(b)
} as const satisfies Record<string, (a: string[], b: string) => boolean>;

export function isArrayOperator(operator: string): operator is ArrayOperator {
    return Object.prototype.hasOwnProperty.call(arrayOperators, operator);
}
