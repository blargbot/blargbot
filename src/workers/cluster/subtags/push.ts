import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class PushSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'push',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'values+'],
                    description: 'Pushes `values` onto the end of `array`. If provided a variable, this will update the original variable. Otherwise, it will simply output the new array.',
                    exampleCode: '{push;["this", "is", "an"];array}',
                    exampleOut: '["this","is","an","array"]',
                    execute: async (context, args, subtag): Promise<string | void> => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        const values = args.slice(1).map(arg => {
                            return arg.value;
                            /*
                            try {
                                return JSON.parse(arg.value);
                            } catch(e) {
                                return arg.value;
                            }
                            */
                        });

                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

                        arr.v.push(...values);
                        if (arr.n !== undefined)
                            await context.variables.set(arr.n, arr.v);
                        else
                            return bbtagUtil.tagArray.serialize(arr.v);
                    }
                }
            ]
        });
    }
}
