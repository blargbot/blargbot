import { BaseSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError, NotANumberError, TooManyLoopsError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class RepeatSubtag extends BaseSubtag {
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
                    execute: async (context, [code, amountStr], subtag) => {
                        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));
                        const amount = parse.int(amountStr.value, false) ?? fallback.value;
                        if (amount === undefined)
                            throw new NotANumberError(amountStr.value);
                        if (amount < 0)
                            throw new BBTagRuntimeError('Can\'t be negative');

                        let result = '';

                        for (let i = 0; i < amount; i++) {
                            try {
                                await context.limit.check(context, subtag, 'repeat:loops');
                            } catch (error: unknown) {
                                if (!(error instanceof TooManyLoopsError))
                                    throw error;

                                // TODO change to be a AsyncIterable
                                result += context.addError(error, subtag);
                                break;
                            }

                            result += await code.execute();
                            if (context.state.return !== 0)
                                break;
                        }
                        return result;
                    }
                }
            ]
        });
    }
}
