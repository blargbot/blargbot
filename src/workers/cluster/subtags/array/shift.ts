import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class ShiftSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'shift',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: 'Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.',
                    exampleCode: '{shift;["this", "is", "an", "array"]}',
                    exampleOut: 'this',
                    execute: (context, [array], subtag) => this.shift(context, array.value, subtag)
                }
            ]
        });
    }

    public async shift(context: BBTagContext, arrayStr: string, subtag: SubtagCall): Promise<string> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? {};
        if (array === undefined)
            return this.notAnArray(context, subtag);

        if (array.length === 0)
            return '';

        const result = array.shift();
        if (varName !== undefined)
            await context.variables.set(varName, array);

        return parse.string(result);
    }
}
