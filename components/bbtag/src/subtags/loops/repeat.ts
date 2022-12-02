import { parse } from '@blargbot/core/utils/index.js';

import { SubtagArgument } from '../../arguments/index.js';
import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import templates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.repeat;

export class RepeatSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'repeat',
            category: SubtagType.LOOPS,
            aliases: ['loop'],
            definition: [
                {
                    parameters: ['~code', 'amount'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
        const amount = parse.int(amountStr) ?? parse.int(context.scopes.local.fallback ?? '');
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
