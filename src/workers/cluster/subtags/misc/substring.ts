import { BaseSubtag } from '@cluster/bbtag';
import { parse, SubtagType } from '@cluster/utils';

export class SubstringSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'substring',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', 'start', 'end?'],
                    description: 'Returns all text from `text` between the `start` and `end`. ' +
                        '`end` defaults to the length of text.',
                    exampleCode: 'Hello {substring;world;2;3}!',
                    exampleOut: 'Hello r!',
                    execute: (context, args, subtag) => {
                        const fallback = context.scope.fallback !== undefined ? parse.int(context.scope.fallback) : context.scope.fallback;
                        const text = args[0].value;
                        let start: number = parse.int(args[1].value);
                        let end: number = parse.int(args[2].value !== '' ? args[2].value : text.length);
                        if (fallback !== undefined) {
                            if (isNaN(start)) start = fallback;
                            if (isNaN(end)) end = fallback;
                        }

                        if (isNaN(start))
                            return this.notANumber(context, subtag, 'start is not a number');
                        if (isNaN(end))
                            return this.notANumber(context, subtag, 'end is not a number');

                        return text.substring(start, end);
                    }
                }
            ]
        });
    }
}
