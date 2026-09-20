import { bbtagArray } from './bbtagArray.js';
import { compare } from './compare.js';
import { parse } from './parse.js';

export type OrdinalOperator = '==' | '!=' | '>=' | '>' | '<=' | '<';
export type StringOperator = 'startswith' | 'endswith' | 'includes' | 'contains';
export type ComparisonOperator = OrdinalOperator | StringOperator;
export type NumericOperator = '+' | '-' | '*' | '/' | '%' | '^';
export type LogicOperator = '||' | '&&' | '!' | 'xor';
export type AggregationOperator = '??';

export function isOrdinalOperator(operator: string): operator is OrdinalOperator {
    return Object.hasOwn(ordinalOperators, operator);
}

export function isStringOperator(operator: string): operator is StringOperator {
    return Object.hasOwn(stringOperators, operator);
}

export function isComparisonOperator(operator: string): operator is ComparisonOperator {
    return isOrdinalOperator(operator) || isStringOperator(operator);
}

export function isNumericOperator(operator: string): operator is NumericOperator {
    return Object.hasOwn(numericOperators, operator);
}

export function isLogicOperator(operator: string): operator is LogicOperator {
    return Object.hasOwn(logicOperators, operator);
}

export function operate<T extends keyof typeof operators>(operator: T, ...args: Parameters<typeof operators[T]>): ReturnType<typeof operators[T]> {
    return operators[operator](...args as [never, never]) as ReturnType<typeof operators[T]>;
}

export const ordinalOperators: Readonly<Record<OrdinalOperator, (a: string, b: string) => boolean>> = {
    '==': (a, b) => compare(a, b) === 0,
    '!=': (a, b) => compare(a, b) !== 0,
    '>=': (a, b) => compare(a, b) >= 0,
    '>': (a, b) => compare(a, b) > 0,
    '<=': (a, b) => compare(a, b) <= 0,
    '<': (a, b) => compare(a, b) < 0
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

function iter<T>(source: Iterable<T>): IteratorObject<T> {
    return Iterator.from(source[Symbol.iterator]());
}
export const logicOperators: Readonly<Record<LogicOperator, (vals: Iterable<boolean>) => boolean>> = {
    '&&': (vals) => iter(vals).every(v => v),
    '||': (vals) => iter(vals).some(v => v),
    'xor': (vals) => iter(vals).filter(v => v).take(2).toArray().length === 1,
    '!': (vals) => !iter(vals).take(1).some(v => v)
};

export const aggregationOperators: Readonly<Record<AggregationOperator, (values: string[]) => string>> = {
    '??': values => {
        for (const value of values)
            if (value.length > 0)
                return value;
        return '';
    }
};

export const comparisonOperators: Readonly<Record<ComparisonOperator, (a: string, b: string) => boolean>> = {
    ...ordinalOperators,
    ...stringOperators
};

export const operators = {
    ...ordinalOperators,
    ...stringOperators,
    ...logicOperators,
    ...numericOperators,
    ...aggregationOperators
} as const;
//TODO bitwise

function getStrArray(text: string): JArray | undefined {
    const arr = bbtagArray.deserialize(text);
    if (arr !== undefined) {
        return arr.v.map(parse.string);
    }
    return undefined;
}
