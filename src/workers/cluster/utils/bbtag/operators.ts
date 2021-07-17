import { compare as compareFn, guard } from '@core/utils';

import { deserialize } from './tagArray';

export function isCompareOperator(operator: string): operator is keyof typeof compare {
    return guard.hasProperty(compare, operator);
}

export function isNumericOperator(operator: string): operator is keyof typeof numeric {
    return guard.hasProperty(numeric, operator);
}

export function isLogicOperator(operator: string): operator is keyof typeof logic {
    return guard.hasProperty(logic, operator);
}

export const compare = {
    '==': (a: string, b: string): boolean => compareFn(a, b) === 0,
    '!=': (a: string, b: string): boolean => compareFn(a, b) !== 0,
    '>=': (a: string, b: string): boolean => compareFn(a, b) >= 0,
    '>': (a: string, b: string): boolean => compareFn(a, b) > 0,
    '<=': (a: string, b: string): boolean => compareFn(a, b) <= 0,
    '<': (a: string, b: string): boolean => compareFn(a, b) < 0,
    startswith(a: string, b: string): boolean {
        const arr = getArray(a);
        if (arr !== false) {
            return arr[0] === b;
        }
        return a.startsWith(b);

    },
    endswith(a: string, b: string): boolean {
        const arr = getArray(a);
        if (arr !== false) {
            return arr.slice(-1)[0] === b;
        }
        return a.endsWith(b);

    },
    includes(a: string, b: string): boolean {
        const arr = getArray(a);
        if (arr !== false) {
            return arr.find((v) => v === b) !== null;
        }
        return a.includes(b);

    },
    contains(a: string, b: string): boolean {
        const arr = getArray(a);
        if (arr !== false) {
            return arr.find((v) => v === b) !== null;
        }
        return a.includes(b);

    }
};

export const numeric = {
    '+': (a: number, b: number): number => a + b,
    '-': (a: number, b: number): number => a - b,
    '*': (a: number, b: number): number => a * b,
    '/': (a: number, b: number): number => a / b,
    '%': (a: number, b: number): number => a % b,
    '^': (a: number, b: number): number => Math.pow(a, b)
};

export const logic = {
    '&&': (vals: boolean[]): boolean => vals.length > 0 && vals.filter(v => v).length === vals.length,
    '||': (vals: boolean[]): boolean => vals.filter(v => v).length > 0,
    'xor': (vals: boolean[]): boolean => vals.filter(v => v).length === 1,
    '^': (vals: boolean[]): boolean => vals.filter(v => v).length === 1, //* Alias of xor
    '!': (vals: boolean[]): boolean => !vals[0]
};

export const all: typeof compare & typeof numeric & typeof logic = Object.assign({}, compare, numeric, logic);
//TODO bitwise

function getArray(text: string): JArray | false {
    const arr = deserialize(text);
    if (arr !== undefined && Array.isArray(arr.v)) {
        return arr.v;
    }
    return false;

}
