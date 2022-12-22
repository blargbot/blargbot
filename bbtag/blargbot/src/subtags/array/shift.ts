import { NotAnArrayError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class ShiftSubtag extends Subtag {
    public constructor() {
        super({
            name: 'shift',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
