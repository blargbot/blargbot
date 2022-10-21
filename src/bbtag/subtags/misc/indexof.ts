import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotANumberError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.indexof;

export class IndexOfSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'indexof',
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
