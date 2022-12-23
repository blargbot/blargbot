export type NumericOperator = keyof typeof numericOperators;

export const numericOperators = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '^': (a, b) => Math.pow(a, b)
} as const satisfies Record<string, (a: number, b: number) => number>;

export function isNumericOperator(operator: string): operator is NumericOperator {
    return Object.prototype.hasOwnProperty.call(numericOperators, operator);
}
