import { parse } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from '../../compilation/index.js';
import { InvalidOperatorError, NotABooleanError } from '../../errors/index.js';
import templates from '../../text.js';
import { bbtag, LogicOperator, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.logic;

export class LogicSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'logic',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['operator', 'values+'],
                    description: tag.default.description({ operators: [...Object.keys(bbtag.logicOperators), '^'] }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
            operator = toLogicOperator(operatorName);
            if (operator !== undefined) {
                args.splice(i, 1);
                break;
            }
        }

        if (operator === undefined)
            throw new InvalidOperatorError(args[0]);

        const values = args;
        const parsed = values.map((value) => {
            const parsed = parse.boolean(value);
            if (parsed === undefined)
                throw new NotABooleanError(value);
            return parsed;
        });

        return bbtag.operate(operator, parsed);
    }
}

function toLogicOperator(operator: string): LogicOperator | undefined {
    if (bbtag.isLogicOperator(operator))
        return operator;
    if (operator === '^')
        return 'xor';
    return undefined;
}
