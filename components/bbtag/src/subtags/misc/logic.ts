import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError, NotABooleanError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagOperators, LogicOperator } from '../../utils/index.js';
import { logicOperators, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.logic;

@Subtag.id('logic')
@Subtag.ctorArgs(Subtag.operators(), Subtag.converter())
export class LogicSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;
    readonly #operators: BBTagOperators;

    public constructor(operators: BBTagOperators, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['operator', 'values+'],
                    description: tag.default.description({ operators: [...logicOperators.keys, '^'] }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (_, values) => this.applyLogicOperation(values.map(arg => arg.value))
                }
            ]
        });

        this.#converter = converter;
        this.#operators = operators;
    }

    public applyLogicOperation(args: string[]): boolean {
        let operator;

        for (let i = 0; i < args.length; i++) {
            const operatorName = args[i].toLowerCase();
            operator = this.#toLogicOperator(operatorName);
            if (operator !== undefined) {
                args.splice(i, 1);
                break;
            }
        }

        if (operator === undefined)
            throw new InvalidOperatorError(args[0]);

        const values = args;
        const parsed = values.map((value) => {
            const parsed = this.#converter.boolean(value);
            if (parsed === undefined)
                throw new NotABooleanError(value);
            return parsed;
        });

        return this.#operators.logic[operator](parsed);
    }

    #toLogicOperator(operator: string): LogicOperator | undefined {
        if (logicOperators.test(operator))
            return operator;
        if (operator === '^')
            return 'xor';
        return undefined;
    }
}
