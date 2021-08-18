import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { CompareOperator } from '@cluster/utils/bbtag/operators';

export class ForSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'for',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['variable', 'initial', 'comparison', 'limit', 'increment?:1', '~code'],
                    description: 'To start, `variable` is set to `initial`. Then, the tag will loop, first checking `variable` against `limit` using `comparison`. ' +
                    'If the check succeeds, `code` will be run before `variable` being incremented by `increment` and the cycle repeating.\n' +
                    'This is very useful for repeating an action (or similar action) a set number of times. Edits to `variable` inside `code` will be ignored',
                    exampleCode: '{for;~index;0;<;10;{get;~index},}',
                    exampleOut: '0,1,2,3,4,5,6,7,8,9,',
                    execute: async (context, args, subtag) => {
                        const errors = [];
                        const varName = args[0].value;
                        const initial = parse.float(args[1].value);
                        const operator = args[2].value;
                        const limit = parse.float(args[3].value);
                        const increment = parse.float(args[4].value);
                        const code = args[5];
                        let result = '';

                        if (isNaN(initial)) errors.push('Initial must be a number');
                        if (!bbtagUtil.operators.isCompareOperator(operator)) errors.push('Invalid operator');
                        if (isNaN(limit)) errors.push('Limit must be a number');
                        if (isNaN(increment)) errors.push('Increment must be a number');
                        if (errors.length > 0) return this.customError(errors.join(', '), context, subtag);

                        for (let i = initial; bbtagUtil.operators.compare[operator as CompareOperator](i.toString(), limit.toString()); i += increment) {
                            if (await context.limit.check(context, subtag, 'for:loops') !== undefined) { // (remaining.loops < 0) would not work due to the comparison behaviours of NaN
                                result += this.tooManyLoops(context, subtag);
                                break;
                            }
                            await context.variables.set(varName, i);
                            result += await code.execute();
                            i = parse.float(parse.string(await context.variables.get(varName)));
                            if (isNaN(i)) {
                                result += this.notANumber(context, subtag);
                                break;
                            }

                            if (context.state.return !== 0)
                                break;
                        }
                        await context.variables.reset(varName);
                        return result;
                    }
                }
            ]
        });
    }
}
