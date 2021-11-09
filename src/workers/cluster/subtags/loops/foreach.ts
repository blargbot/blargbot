import { BaseSubtag } from '@cluster/bbtag';
import { TooManyLoopsError } from '@cluster/bbtag/errors';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ForeachSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'foreach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and then `code` will be run.\n' +
                        'If `element` is not an array, it will iterate over each character intead.',
                    exampleCode: '{set;~array;apples;oranges;c#}\n{foreach;~element;~array;I like {get;~element}{newline}}',
                    exampleOut: 'I like apples\nI like oranges\nI like c#',
                    execute: async (context, [{ value: varName }, { value: arrStr }, code], subtag) => {
                        const arr = await bbtagUtil.tagArray.getArray(context, arrStr) ?? { v: arrStr.split('') };
                        let result = '';
                        const array = Array.from(arr.v);

                        for (const item of array) {
                            if (await context.limit.check(context, subtag, 'foreach:loops') !== undefined) { // (remaining.loops < 0) would not work due to the comparison behaviours of NaN
                                const error = new TooManyLoopsError(-1);
                                result += context.addError(error.message, subtag, error.detail);
                                break;
                            }
                            await context.variables.set(varName, item);
                            result += await code.execute();
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
