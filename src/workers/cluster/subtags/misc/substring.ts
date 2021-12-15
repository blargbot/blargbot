import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SubstringSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (ctx, [text, start, end]) => this.substring(ctx, text.value, start.value, end.value)
                }
            ]
        });
    }

    public substring(context: BBTagContext, text: string, startStr: string, endStr: string): string {
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? '', false));
        const start = parse.int(startStr, false) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const end = parse.int(endStr !== '' ? endStr : text, false) ?? fallback.value;
        if (end === undefined)
            throw new NotANumberError(endStr);

        return text.substring(start, end);
    }
}
