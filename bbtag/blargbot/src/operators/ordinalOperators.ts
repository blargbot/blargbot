import type { ComparePlugin } from '../plugins/ComparePlugin.js';

export type OrdinalOperator = keyof typeof ordinalOperators;

export const ordinalOperators = {
    '==': (comp, a, b) => comp.compare(a, b) === 0,
    '!=': (comp, a, b) => comp.compare(a, b) !== 0,
    '>=': (comp, a, b) => comp.compare(a, b) >= 0,
    '>': (comp, a, b) => comp.compare(a, b) > 0,
    '<=': (comp, a, b) => comp.compare(a, b) <= 0,
    '<': (comp, a, b) => comp.compare(a, b) < 0
} as const satisfies Record<string, (comparer: ComparePlugin, a: string, b: string) => boolean>;

export function isOrdinalOperator(operator: string): operator is OrdinalOperator {
    return Object.prototype.hasOwnProperty.call(ordinalOperators, operator);
}
