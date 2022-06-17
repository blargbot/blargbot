import { parse } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { CompiledSubtag } from '../../compilation';
import { InvalidOperatorError, NotABooleanError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class IfSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'if',
            category: SubtagType.MISC,
            description:
                'If `evaluator` and `value2` are provided, `value1` is evaluated against `value2` using `evaluator`. ' +
                'If they are not provided, `value1` is read as `true` or `false`. ' +
                'If the resulting value is `true` then the tag returns `then`, otherwise it returns `else`.\n' +
                'Valid evaluators are `' + Object.keys(bbtag.comparisonOperators).join('`, `') + '`.',
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description: 'If `boolean` is `true`, return `then`, else do nothing.',
                    exampleCode: '{if;{iscc};This is a custom command!}',
                    exampleOut: 'This is a custom command!',
                    returns: 'string',
                    execute: (_, [bool, thenCode]) => this.simpleBooleanCheck(bool.value, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description: 'If `boolean` is `true`, return `then`, else execute `else`',
                    exampleCode: '{if;{iscc};This is a custom command!;This isnt a custom command!}',
                    exampleOut: 'This isnt a custom command!',
                    returns: 'string',
                    execute: (_, [bool, thenCode, elseCode]) => this.simpleBooleanCheck(bool.value, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description: '`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`.',
                    exampleCode: '{if;{userid};==;103347843934212096;Hi stupid cat!}',
                    exampleOut: 'Hi stupid cat!',
                    returns: 'string',
                    execute: (_, [value1, evaluator, value2, thenCode]) => this.evaluatorCheck(value1.value, evaluator.value, value2.value, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description: '`Value1` is evaluated against `value2` using `evaluator`, if the resulting value is `true` then the tag returns `then`, otherwise it returns `else`',
                    exampleCode: '{if;{userid};==;103347843934212096;Hi stupid cat!;Who are you stranger?}',
                    exampleOut: 'Who are you stranger?',
                    returns: 'string',
                    execute: (_, [value1, evaluator, value2, thenCode, elseCode]) => this.evaluatorCheck(value1.value, evaluator.value, value2.value, thenCode, elseCode)
                }
            ]
        });
    }
    public async simpleBooleanCheck(
        bool: string,
        thenCode: SubtagArgument,
        elseCode?: SubtagArgument
    ): Promise<string> {
        const actualBoolean = parse.boolean(bool);
        if (typeof actualBoolean !== 'boolean')
            throw new NotABooleanError(bool);

        if (actualBoolean) {
            return await thenCode.wait();
        }
        return await elseCode?.wait() ?? '';

    }

    public async evaluatorCheck(
        value1: string,
        evaluator: string,
        value2: string,
        thenCode: SubtagArgument,
        elseCode?: SubtagArgument
    ): Promise<string> {
        let operator;
        if (bbtag.isComparisonOperator(evaluator)) {
            operator = evaluator;
        } else if (bbtag.isComparisonOperator(value1)) {
            operator = value1;
            [value1, evaluator] = [evaluator, value1];
        } else if (bbtag.isComparisonOperator(value2)) {
            operator = value2;
            [evaluator, value2] = [value2, evaluator];
        } else
            throw new InvalidOperatorError(evaluator);

        const leftBool = parse.boolean(value1, undefined, false);
        if (leftBool !== undefined)
            value1 = leftBool.toString();

        const rightBool = parse.boolean(value2, undefined, false);
        if (rightBool !== undefined)
            value2 = rightBool.toString();

        if (bbtag.operate(operator, value1, value2))
            return await thenCode.wait();
        return await elseCode?.wait() ?? '';
    }
}
