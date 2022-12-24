export type OrdinalOperator = keyof typeof ordinalOperators;

export const ordinalOperators = {
    '==': (a, b) => a === b,
    '!=': (a, b) => a !== b,
    '>=': (a, b) => a >= b,
    '>': (a, b) => a > b,
    '<=': (a, b) => a <= b,
    '<': (a, b) => a < b
} as const satisfies Record<string, <T extends string | number>(a: T, b: T) => boolean>;

export function isOrdinalOperator(operator: string): operator is OrdinalOperator {
    return Object.prototype.hasOwnProperty.call(ordinalOperators, operator);
}
