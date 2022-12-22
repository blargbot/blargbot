import { NotAnArrayError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class PushSubtag extends Subtag {
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
