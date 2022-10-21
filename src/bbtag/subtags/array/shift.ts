import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.shift;

export class ShiftSubtag extends CompiledSubtag {
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
                    returns: 'json|nothing',
                    execute: (context, [array]) => this.shift(context, array.value)
                }
            ]
        });
    }

    public async shift(context: BBTagContext, arrayStr: string): Promise<JToken | undefined> {
        const { n: varName, v: array } = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr) ?? {};
        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        if (array.length === 0)
            return '';

        const result = array.shift();
        if (varName !== undefined)
            await context.variables.set(varName, array);

        return result;
    }
}
