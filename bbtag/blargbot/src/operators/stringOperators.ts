export type StringOperator = keyof typeof stringOperators;

export const stringOperators = {
    startswith: (a, b) => a.startsWith(b),
    endswith: (a, b) => a.endsWith(b),
    contains: (a, b) => a.includes(b),
    includes: (a, b) => a.includes(b)
} as const satisfies Record<string, (a: string, b: string) => boolean>;

export function isStringOperator(operator: string): operator is StringOperator {
    return Object.prototype.hasOwnProperty.call(stringOperators, operator);
}
