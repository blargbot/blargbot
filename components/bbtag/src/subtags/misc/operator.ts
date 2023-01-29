import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { SubtagSignatureCallableOptions as Options } from '../../compilation/SubtagSignatureCallableOptions.js';
import { InvalidOperatorError, NotABooleanError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools, LogicOperator, NumericOperator, OrdinalOperator, StringOperator } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { AggregationOperator, BBTagOperators } from '../../utils/operators.js';
import { aggregationOperators, logicOperators, numericOperators, ordinalOperators, stringOperators } from '../../utils/operators.js';

const tag = templates.subtags.operator;

@Subtag.names('operator')
@Subtag.ctorArgs(Subtag.operators(), Subtag.arrayTools(), Subtag.converter())
export class OperatorSubtag extends CompiledSubtag {
    readonly #operators: BBTagOperators;
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(operators: BBTagOperators, arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                ...ordinalOperators.keys.map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyOrdinalOperation(op, values.map(v => v.value))
                })),
                ...stringOperators.keys.map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyStringOperation(op, values.map(v => v.value))
                })),
                ...logicOperators.keys.map<Options<'boolean'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'boolean',
                    execute: (_, values) => this.applyLogicOperation(op, values.map(v => v.value))
                })),
                ...numericOperators.keys.map<Options<'number'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'number',
                    execute: (_, values) => this.applyNumericOperation(op, values.map(v => v.value))
                })),
                ...aggregationOperators.keys.map<Options<'string'>>(op => ({
                    ...tag[op],
                    subtagName: op,
                    parameters: ['values+'],
                    returns: 'string',
                    execute: (_, values) => this.applyAggregationOperation(op, values.map(v => v.value))
                })),
                {
                    parameters: ['values+'],
                    returns: 'error',
                    execute: (_, values) => { throw new InvalidOperatorError(values.subtagName); }
                }
            ]
        });

        this.#operators = operators;
        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public applyOrdinalOperation(operator: OrdinalOperator, values: string[]): boolean {
        const flattenedValues = this.#arrayTools.flattenArray(values).map(v => this.#converter.string(v));
        return this.#operators.logic['&&'](generatePairs(flattenedValues)
            .map(args => this.#operators.ordinal[operator](...args)));
    }

    public applyAggregationOperation(operator: AggregationOperator, values: string[]): string {
        const flattenedValues = this.#arrayTools.flattenArray(values).map(v => this.#converter.string(v));
        return this.#operators.aggregation[operator](flattenedValues);
    }

    public applyStringOperation(operator: StringOperator, values: string[]): boolean {
        const firstValue = values[0];
        values = values.slice(1);
        const operatedValues = values.map((value) => this.#operators.string[operator](firstValue, value));

        return this.#operators.logic['&&'](operatedValues);
    }

    public applyNumericOperation(operator: NumericOperator, values: string[]): number {
        return this.#arrayTools.flattenArray(values).map((arg: JToken | undefined) => {
            if (typeof arg === 'string')
                arg = this.#converter.float(arg);
            if (typeof arg !== 'number')
                throw new NotANumberError(arg);
            return arg;
        }).reduce(this.#operators.numeric[operator]);
    }

    public applyLogicOperation(operator: LogicOperator, values: string[]): boolean {
        const parsed = values.map((value) => {
            const bool = this.#converter.boolean(value);
            if (bool === undefined)
                throw new NotABooleanError(value);
            return bool;
        });
        return this.#operators.logic[operator](parsed);
    }
}

function generatePairs(array: string[]): Array<[string, string]> {
    const pairedArrays: Array<[string, string]> = [];
    for (let i = 0; i < array.length; i++) {
        if (i === array.length - 1) break;
        pairedArrays.push([array[i], array[i + 1]]);
    }
    return pairedArrays;
}
