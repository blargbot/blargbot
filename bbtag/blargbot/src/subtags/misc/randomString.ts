import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.randomString;

@Subtag.id('randomString', 'randStr', 'randString')
@Subtag.ctorArgs('converter')
export class RandomStringSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['chars', 'length'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [chars, count]) => this.randStr(ctx, chars.value, count.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public randStr(
        context: BBTagScript,
        charsStr: string,
        countStr: string
    ): string {
        const chars = charsStr.split('');
        const count = this.#converter.int(countStr) ?? this.#converter.int(context.runtime.scopes.local.fallback ?? '');
        if (count === undefined)
            throw new NotANumberError(countStr);

        if (chars.length === 0)
            throw new BBTagRuntimeError('Not enough characters');

        const numberArray = [...Array(count).keys()]; // TODO: count should be limited here
        return numberArray.map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    }
}
