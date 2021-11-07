import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class IndexOfSubtag extends BaseSubtag {
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
                    execute: (context, [{ value: text }, { value: query }, { value: start }]) => {
                        const from = parse.int(start, false) ?? parse.int(context.scopes.local.fallback ?? '', false);
                        if (from === undefined)
                            throw new NotANumberError(start);

                        const { v: input } = bbtagUtil.tagArray.deserialize(text) ?? { v: text };
                        return input.indexOf(query, from).toString();
                    }
                }
            ]
        });
    }
}
