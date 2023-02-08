export type OrdinalOperator = '==' | '!=' | '>=' | '>' | '<=' | '<';
export type StringOperator = 'startswith' | 'endswith' | 'includes' | 'contains';
export type ComparisonOperator = OrdinalOperator | StringOperator;
export type NumericOperator = '+' | '-' | '*' | '/' | '%' | '^';
export type LogicOperator = '||' | '&&' | '!' | 'xor';
export type AggregationOperator = '??';

export interface BBTagOperatorsOptions {
    compare: (a: string, b: string) => number;
    parseArray: (value: string) => JArray | undefined;
    convertToString: (value: JToken) => string;
}

type OperatorMethods<Operators extends string, Args extends readonly unknown[], Result> = {
    readonly [P in Operators]: (this: void, ...args: Args) => Result
}

export interface BBTagOperators {
    readonly ordinal: OperatorMethods<OrdinalOperator, [a: string, b: string], boolean>;
    readonly string: OperatorMethods<StringOperator, [a: string, b: string], boolean>;
    readonly numeric: OperatorMethods<NumericOperator, [a: number, b: number], number>;
    readonly logic: OperatorMethods<LogicOperator, [vals: boolean[]], boolean>;
    readonly aggregation: OperatorMethods<AggregationOperator, [values: string[]], string>;
    readonly comparison: OperatorMethods<ComparisonOperator, [a: string, b: string], boolean>;
}

export type OperatorGroupDetails<Operators extends string> = {
    keys: readonly Operators[];
    test(value: string): value is Operators;
}

const dummyOperators = createBBTagOperators({
    compare: () => 0,
    convertToString: () => '',
    parseArray: () => undefined
});

export const ordinalOperators = toOperatorGroupDetails(dummyOperators.ordinal);
export const stringOperators = toOperatorGroupDetails(dummyOperators.string);
export const numericOperators = toOperatorGroupDetails(dummyOperators.numeric);
export const logicOperators = toOperatorGroupDetails(dummyOperators.logic);
export const aggregationOperators = toOperatorGroupDetails(dummyOperators.aggregation);
export const comparisonOperators = toOperatorGroupDetails(dummyOperators.comparison);

function toOperatorGroupDetails<Operators extends string>(operators: OperatorMethods<Operators, never, unknown>): OperatorGroupDetails<Operators> {
    const keys = Object.freeze(Object.keys(operators));
    const lookup = new Set<string>(keys);
    return {
        keys: keys,
        test: (v): v is Operators => lookup.has(v)
    };
}

export function createBBTagOperators(options: BBTagOperatorsOptions): BBTagOperators {
    function readAsMaybeArray(value: string): string | string[] {
        return options.parseArray(value)?.map(options.convertToString) ?? value;
    }
    const ordinalOperators: BBTagOperators['ordinal'] = {
        '==': (a, b) => options.compare(a, b) === 0,
        '!=': (a, b) => options.compare(a, b) !== 0,
        '>=': (a, b) => options.compare(a, b) >= 0,
        '>': (a, b) => options.compare(a, b) > 0,
        '<=': (a, b) => options.compare(a, b) <= 0,
        '<': (a, b) => options.compare(a, b) < 0
    };
    const stringOperators: BBTagOperators['string'] = {
        startswith(a, b) {
            const arr = readAsMaybeArray(a);
            return typeof arr === 'string'
                ? arr.startsWith(b)
                : arr[0] === b;
        },
        endswith(a, b) {
            const arr = readAsMaybeArray(a);
            return typeof arr === 'string'
                ? arr.endsWith(b)
                : arr[arr.length - 1] === b;
        },
        includes(a, b) {
            const arr = readAsMaybeArray(a);
            return arr.includes(b);

        },
        get contains() {
            return this.includes;
        }
    };
    const numericOperators: BBTagOperators['numeric'] = {
        '+': (a, b) => a + b,
        '-': (a, b) => a - b,
        '*': (a, b) => a * b,
        '/': (a, b) => a / b,
        '%': (a, b) => a % b,
        '^': (a, b) => Math.pow(a, b)
    };
    const logicOperators: BBTagOperators['logic'] = {
        '&&': (vals) => vals.length > 0 && vals.filter(v => v).length === vals.length,
        '||': (vals) => vals.filter(v => v).length > 0,
        'xor': (vals) => vals.filter(v => v).length === 1,
        '!': (vals) => !vals[0]
    };
    const aggregationOperators: BBTagOperators['aggregation'] = {
        '??': values => {
            for (const value of values)
                if (value.length > 0)
                    return value;
            return '';
        }
    };
    const comparisonOperators: BBTagOperators['comparison'] = {
        ...ordinalOperators,
        ...stringOperators
    };
    return {
        ordinal: ordinalOperators,
        aggregation: aggregationOperators,
        comparison: comparisonOperators,
        logic: logicOperators,
        numeric: numericOperators,
        string: stringOperators
    };
}
