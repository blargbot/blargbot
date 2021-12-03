import { Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotABooleanError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

const operators = bbtagUtil.operators.logic;

export class LogicSubtag extends Subtag {
    public constructor() {
        super({
            name: 'logic',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['operator', 'values+'],
                    description: 'Accepts 1 or more boolean `values` (`true` or `false`) and returns the result of `operator` on them. ' +
                        'Valid logic operators are `' + Object.keys(operators).join('`, `') + '`.' +
                        'See `{operators}` for a shorter way of performing logic operations.',
                    exampleCode: '{logic;&&;true;false}',
                    exampleOut: 'false',
                    returns: 'boolean',
                    execute: (_, values) => this.applyLogicOperation(values.map(arg => arg.value))
                }
            ]
        });
    }

    public applyLogicOperation(args: string[]): boolean {
        let operator;

        for (let i = 0; i < args.length; i++) {
            const operatorName = args[i].toLowerCase();
            if (bbtagUtil.operators.isLogicOperator(operatorName)) {
                operator = operatorName;
                args.splice(i, 1);
            }
        }

        if (operator === undefined)
            throw new BBTagRuntimeError('Invalid operator');

        const values = args;
        if (operator === '!') {
            const value = parse.boolean(values[0]);
            if (value === undefined)
                throw new NotABooleanError(values[0]);
            return operators[operator]([value]);
        }
        const parsed = values.map((value) => {
            const parsed = parse.boolean(value);
            if (parsed === undefined)
                throw new NotABooleanError(value);
            return parsed;
        });
        return operators[operator](parsed);
    }
}
