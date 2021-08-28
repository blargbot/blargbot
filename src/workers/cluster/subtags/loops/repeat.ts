import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class RepeatSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'repeat',
            category: SubtagType.LOOPS,
            aliases: ['loop'],
            definition: [
                {
                    parameters: ['code', 'amount'],
                    description: 'Repeatedly executes `code` `amount` times.',
                    exampleCode: '{repeat;e;10}',
                    exampleOut: 'eeeeeeeeee',
                    execute: async (context, args, subtag) => {
                        const fallback = parse.int(context.scope.fallback !== undefined ? context.scope.fallback : '');
                        let amount = parse.int(args[1].value);
                        let result = '';

                        if (isNaN(amount)) {
                            if (isNaN(fallback))
                                return this.notANumber(context, subtag, context.scope.fallback === undefined ? 'amount is not a number' : 'amount and fallback are not numbers');
                            amount = fallback;
                        }

                        if (amount < 0) return this.customError('Can\'t be negative', context, subtag);

                        for (let i = 0; i < amount; i++) {
                            if (await context.limit.check(context, subtag, 'repeat:loops') !== undefined) {
                                result += this.tooManyLoops(context, subtag);
                                break;
                            }
                            result += await args[0].execute();
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
