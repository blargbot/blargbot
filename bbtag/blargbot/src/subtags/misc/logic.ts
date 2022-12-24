import { Subtag } from '@bbtag/subtag';

import { InvalidOperatorError } from '../../errors/InvalidOperatorError.js';
import { NotABooleanError } from '../../errors/NotABooleanError.js';
import type { LogicOperator } from '../../operators/logicOperators.js';
import { isLogicOperator, logicOperators } from '../../operators/logicOperators.js';
import { BooleanPlugin } from '../../plugins/BooleanPlugin.js';
import { p } from '../p.js';

export class LogicSubtag extends Subtag {
    public constructor() {
        super({
            name: 'logic'
        });
    }

    @Subtag.signature({ id: 'default', returns: 'boolean' })
        .parameter(p.plugin(BooleanPlugin))
        .parameter(p.string('operator'))
        .parameter(p.string('values').repeat())
    public applyLogicOperation(boolean: BooleanPlugin, operator: string, values: string[]): boolean {
        let op;
        const args = [operator, ...values];
        for (let i = 0; i < args.length; i++) {
            const operatorName = args[i].toLowerCase();
            op = toLogicOperator(operatorName);
            if (op !== undefined) {
                args.splice(i, 1);
                break;
            }
        }

        if (op === undefined)
            throw new InvalidOperatorError(args[0]);

        return logicOperators[op](args.map(v => {
            if (typeof v === 'boolean')
                return v;
            if (typeof v !== 'string')
                throw new NotABooleanError(v);
            const res = boolean.parseBoolean(v);
            if (res === undefined)
                throw new NotABooleanError(v);
            return res;
        }));
    }
}

function toLogicOperator(operator: string): LogicOperator | undefined {
    if (isLogicOperator(operator))
        return operator;
    if (operator === '^')
        return 'xor';
    return undefined;
}
