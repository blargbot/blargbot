import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError, NotANumberError } from '../../errors';
import { BBTagRuntimeState, SubtagArgument } from '../../types';
import { SubtagType } from '../../utils';

export class RepeatSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'repeat',
            category: SubtagType.LOOPS,
            aliases: ['loop'],
            definition: [
                {
                    parameters: ['~code', 'amount'],
                    description: 'Repeatedly executes `code` `amount` times.',
                    exampleCode: '{repeat;e;10}',
                    exampleOut: 'eeeeeeeeee',
                    returns: 'loop',
                    execute: (ctx, [code, amount]) => this.repeat(ctx, amount.value, code)
                }
            ]
        });
    }
    public async* repeat(
        context: BBTagContext,
        amountStr: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const amount = parse.int(amountStr, false) ?? parse.int(context.scopes.local.fallback ?? '', false);
        if (amount === undefined)
            throw new NotANumberError(amountStr);
        if (amount < 0)
            throw new BBTagRuntimeError('Can\'t be negative');

        for (let i = 0; i < amount; i++) {
            await context.limit.check(context, 'repeat:loops');
            yield await code.execute();
            if (context.data.state !== BBTagRuntimeState.RUNNING)
                break;
        }
    }
}
