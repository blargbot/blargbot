import { compare } from '..';
import { deserialize } from './tagArray';

interface CompareHandler {
    [index: string]: (a: string, b: string) => boolean;
}

interface NumericHandler {
    [index: string]: (a: number, b: number) => number;
}

interface LogicHandler {
    [index: string]: (booleanArray: boolean[]) => boolean;
}

interface OperatorObject {
    compare: CompareHandler;
    numeric: NumericHandler;
    logic: LogicHandler;
    //TODO bitwise
}

function getArray(text: string): JArray | false {
    const arr = deserialize(text);
    if (arr && Array.isArray(arr.v)) {
        return arr.v;
    } else {
        return false;
    }
}
const operators: OperatorObject = {
    compare: {
        '==': (a, b) => compare(a, b) == 0,
        '!=': (a, b) => compare(a, b) != 0,
        '>=': (a, b) => compare(a, b) >= 0,
        '>': (a, b) => compare(a, b) > 0,
        '<=': (a, b) => compare(a, b) <= 0,
        '<': (a, b) => compare(a, b) < 0,
        startswith: (a: string, b: string): boolean => {
            const arr = getArray(a);
            if (arr) {
                return arr[0] == b;
            } else {
                return a.startsWith(b);
            }
        },
        endswith: (a: string, b: string): boolean => {
            const arr = getArray(a);
            if (arr) {
                return arr.slice(-1)[0] == b;
            } else {
                return a.endsWith(b);
            }
        },
        includes: (a: string, b: string): boolean => {
            const arr = getArray(a);
            if (arr) {
                return arr.find((v) => v == b) != null;
            } else {
                return a.includes(b);
            }
        },
        contains: (a: string, b: string): boolean => {
            const arr = getArray(a);
            if (arr) {
                return arr.find((v) => v == b) != null;
            } else {
                return a.includes(b);
            }
        }
    },
    numeric: {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '%': (a, b) => a % b,
        '^': (a, b) => Math.pow(a, b)
    },
    logic: {
        '&&': (vals) => vals.length > 0 && vals.filter(v => v).length == vals.length,
        '||': (vals) => vals.filter(v => v).length > 0,
        'xor': (vals) => vals.filter(v => v).length == 1,
        '^': (vals) => vals.filter(v => v).length == 1, //* Alias of xor
        '!': (vals) => !vals[0]
    }
    //TODO bitwise
};

export { operators as operatorTypes };
export default Object.assign({}, operators.compare, operators.numeric, operators.logic);
