import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class PopSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'pop',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: 'Returns the last element in `array`. If provided a variable, this will remove the last element from `array`as well.',
                    exampleCode: '{pop;["this", "is", "an", "array"]}',
                    exampleOut: 'array',
                    execute: (context, [array]) => this.pop(context, array.value)
                }
            ]
        });
    }

    public async pop(context: BBTagContext, arrayStr: string): Promise<string> {
        const { n: varName, v: array } = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (array.length === 0)
            return '';

        const result = array.pop();
        if (varName !== undefined)
            await context.variables.set(varName, array);

        return parse.string(result);
    }
}
