import { NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { parse } from '@blargbot/core/utils/index.js';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class IndexOfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'indexOf',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text|array', 'searchfor', 'start?:0'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [text, search, start]) => this.indexOf(ctx, text.value, search.value, start.value)
                }
            ]
        });
    }

    public indexOf(context: BBTagContext, text: string, query: string, startStr: string): number {
        const from = parse.int(startStr) ?? parse.int(context.scopes.local.fallback ?? '');
        if (from === undefined)
            throw new NotANumberError(startStr);

        const { v: input } = bbtag.tagArray.deserialize(text) ?? { v: text };
        return input.indexOf(query, from);
    }
}
