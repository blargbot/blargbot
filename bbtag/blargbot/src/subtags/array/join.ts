import { NotAnArrayError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class JoinSubtag extends Subtag {
    public constructor() {
        super({
            name: 'join',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (context, [array, join]) => this.join(context, array.value, join.value)
                }
            ]
        });
    }

    public async join(context: BBTagContext, arrayStr: string, separator: string): Promise<string> {
        const { v: array } = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr) ?? {};

        if (array === undefined)
            throw new NotAnArrayError(arrayStr);

        return array.join(separator);
    }
}
