import { Subtag } from '@bbtag/subtag';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class ReverseSubtag extends Subtag {
    public constructor() {
        super({
            name: 'reverse',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text]) => this.reverse(ctx, text.value)
                }
            ]
        });
    }

    public async reverse(context: BBTagContext, input: string): Promise<string> {
        const arr = bbtag.tagArray.deserialize(input);
        if (arr === undefined)
            return input.split('').reverse().join('');

        arr.v = arr.v.reverse();
        if (arr.n === undefined)
            return bbtag.tagArray.serialize(arr.v);

        await context.variables.set(arr.n, arr.v);
        return '';
    }
}
