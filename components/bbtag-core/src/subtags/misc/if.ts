import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagArgument } from '../../arguments/index.js';
import { InvalidOperatorError, NotABooleanError } from '../../errors/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class IfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'if',
            category: SubtagType.MISC,
            description: tag.description({ operators: Object.keys(bbtag.comparisonOperators) }),
            definition: [
                {
                    parameters: ['boolean', '~then'],
                    description: tag.value.description,
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'string',
                    execute: (_, [bool, thenCode]) => this.simpleBooleanCheck(bool.value, thenCode)
                },
                {
                    parameters: ['boolean', '~then', '~else'],
                    description: tag.valueElse.description,
                    exampleCode: tag.valueElse.exampleCode,
                    exampleOut: tag.valueElse.exampleOut,
                    returns: 'string',
                    execute: (_, [bool, thenCode, elseCode]) => this.simpleBooleanCheck(bool.value, thenCode, elseCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then'],
                    description: tag.conditionThen.description,
                    exampleCode: tag.conditionThen.exampleCode,
                    exampleOut: tag.conditionThen.exampleOut,
                    returns: 'string',
                    execute: (_, [value1, evaluator, value2, thenCode]) => this.evaluatorCheck(value1.value, evaluator.value, value2.value, thenCode)
                },
                {
                    parameters: ['value1', 'evaluator', 'value2', '~then', '~else'],
                    description: tag.conditionElse.description,
                    exampleCode: tag.conditionElse.exampleCode,
                    exampleOut: tag.conditionElse.exampleOut,
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
