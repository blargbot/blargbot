export type AggregationOperator = keyof typeof aggregationOperators;

export const aggregationOperators = {
    '??': values => values.find(v => v.length > 0) ?? ''
} as const satisfies Record<string, (vals: string[]) => string>;

export function isAggregationOperator(operator: string): operator is AggregationOperator {
    return Object.prototype.hasOwnProperty.call(aggregationOperators, operator);
}
