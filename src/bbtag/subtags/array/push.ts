import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.push;

export class PushSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'push',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'values+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (context, [array, ...values]) => this.push(context, array.value, values.map(v => v.value))
                }
            ]
        });
    }

    public async push(context: BBTagContext, arrayStr: string, values: string[]): Promise<JArray | undefined> {
        const { n: varName, v: array } = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        array.push(...values);
        if (varName === undefined)
            return array;

        await context.variables.set(varName, array);
        return undefined;
    }
}
