import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
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
                    execute: (context, [array, ...values], subtag) => this.push(context, array.value, values.map(v => v.value), subtag)
                }
            ]
        });
    }

    public async push(context: BBTagContext, arrayStr: string, values: string[], subtag: SubtagCall): Promise<string | undefined> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? {};

        if (array === undefined)
            return this.notAnArray(context, subtag);

        array.push(...values);
        if (varName === undefined)
            return bbtagUtil.tagArray.serialize(array);

        await context.variables.set(varName, array);
        return undefined;
    }
}
