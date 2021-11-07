import { BaseSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

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
                    execute: (context, [text, startStr, endStr]) => {
                        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));
                        const start = parse.int(startStr.value, false) ?? fallback.value;
                        if (start === undefined)
                            throw new NotANumberError(startStr.value);

                        const end = parse.int(endStr.value !== '' ? endStr.value : text.value.length, false) ?? fallback.value;
                        if (end === undefined)
                            throw new NotANumberError(endStr.value);

                        return text.value.substring(start, end);
                    }
                }
            ]
        });
    }
}
