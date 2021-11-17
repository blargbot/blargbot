import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class IndexOfSubtag extends Subtag {
    public constructor() {
        super({
            name: 'indexof',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text|array', 'searchfor', 'start?:0'],
                    description: 'Finds the index of `searchfor` in `text|array`, after `start`. `text|array` can either be plain text or an array. If it\'s not found, returns -1.',
                    exampleCode: 'The index of "o" in "hello world" is {indexof;hello world;o}',
                    exampleOut: 'The index of "o" in "hello world" is 4',
                    returns: 'number',
                    execute: (ctx, [text, search, start]) => this.indexOf(ctx, text.value, search.value, start.value)
                }
            ]
        });
    }

    public indexOf(context: BBTagContext, text: string, query: string, startStr: string): number {
        const from = parse.int(startStr, false) ?? parse.int(context.scopes.local.fallback ?? '', false);
        if (from === undefined)
            throw new NotANumberError(startStr);

        const { v: input } = bbtagUtil.tagArray.deserialize(text) ?? { v: text };
        return input.indexOf(query, from);
    }
}
