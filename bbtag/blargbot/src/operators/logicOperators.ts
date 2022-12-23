export type LogicOperator = keyof typeof logicOperators;

export const logicOperators = {
    '&&': (vals) => vals.length > 0 && !vals.includes(false),
    '||': (vals) => vals.includes(true),
    'xor': (vals) => vals.filter(v => v).length === 1,
    '!': (vals) => !vals[0]
} as const satisfies Record<string, (vals: boolean[]) => boolean>;

export function isLogicOperator(operator: string): operator is LogicOperator {
    return Object.prototype.hasOwnProperty.call(logicOperators, operator);
}
