import { compare as compareFn, guard, parse } from '@blargbot/core/utils';

import { tagArray } from './tagArray';

export type OrdinalOperator = `==` | `!=` | `>=` | `>` | `<=` | `<`;
export type StringOperator = `startswith` | `endswith` | `includes` | `contains`;
export type ComparisonOperator = OrdinalOperator | StringOperator;
export type NumericOperator = `+` | `-` | `*` | `/` | `%` | `^`;
export type LogicOperator = `||` | `&&` | `!` | `xor`;

export function isOrdinalOperator(operator: string): operator is OrdinalOperator {
    return guard.hasProperty(ordinalOperators, operator);
}

export function isStringOperator(operator: string): operator is StringOperator {
    return guard.hasProperty(stringOperators, operator);
}

export function isComparisonOperator(operator: string): operator is ComparisonOperator {
    return isOrdinalOperator(operator) || isStringOperator(operator);
}

export function isNumericOperator(operator: string): operator is NumericOperator {
    return guard.hasProperty(numericOperators, operator);
}

export function isLogicOperator(operator: string): operator is LogicOperator {
    return guard.hasProperty(logicOperators, operator);
}

export function operate<T extends keyof typeof operators>(operator: T, ...args: Parameters<typeof operators[T]>): ReturnType<typeof operators[T]> {
    return operators[operator](...args as [never, never]) as ReturnType<typeof operators[T]>;
}

export const ordinalOperators: Readonly<Record<OrdinalOperator, (a: string, b: string) => boolean>> = {
    '==': (a, b) => compareFn(a, b) === 0,
    '!=': (a, b) => compareFn(a, b) !== 0,
    '>=': (a, b) => compareFn(a, b) >= 0,
    '>': (a, b) => compareFn(a, b) > 0,
    '<=': (a, b) => compareFn(a, b) <= 0,
    '<': (a, b) => compareFn(a, b) < 0
};

export const stringOperators: Readonly<Record<StringOperator, (a: string, b: string) => boolean>> = {
    startswith(a, b) {
        const arr = getStrArray(a);
        return arr === undefined
            ? a.startsWith(b)
            : arr[0] === b;
    },
    endswith(a, b) {
        const arr = getStrArray(a);
        return arr === undefined
            ? a.endsWith(b)
            : arr[arr.length - 1] === b;
    },
    includes(a, b) {
        const arr = getStrArray(a) ?? a;
        return arr.includes(b);

    },
    get contains() {
        return this.includes;
    }
};

export const numericOperators: Readonly<Record<NumericOperator, (a: number, b: number) => number>> = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
    '%': (a, b) => a % b,
    '^': (a, b) => Math.pow(a, b)
};

export const logicOperators: Readonly<Record<LogicOperator, (vals: boolean[]) => boolean>> = {
    '&&': (vals) => vals.length > 0 && vals.filter(v => v).length === vals.length,
    '||': (vals) => vals.filter(v => v).length > 0,
    'xor': (vals) => vals.filter(v => v).length === 1,
    '!': (vals) => !vals[0]
};

export const comparisonOperators: Readonly<Record<ComparisonOperator, (a: string, b: string) => boolean>> = {
    ...ordinalOperators,
    ...stringOperators
};

export const operators = {
    ...ordinalOperators,
    ...stringOperators,
    ...logicOperators,
    ...numericOperators
} as const;
//TODO bitwise

function getStrArray(text: string): JArray | undefined {
    const arr = tagArray.deserialize(text);
    if (arr !== undefined) {
        return arr.v.map(v => parse.string(v));
    }
    return undefined;
}
