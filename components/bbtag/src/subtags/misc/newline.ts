import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.newline;

@Subtag.names('newline', 'n')
@Subtag.ctorArgs(Subtag.converter())
export class NewlineSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['count?:1'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [count]) => this.getNewlines(ctx, count.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public getNewlines(context: BBTagContext, countStr: string): string {
        const count = this.#converter.int(countStr) ?? this.#converter.int(context.scopes.local.fallback ?? '');
        if (count === undefined)
            throw new NotANumberError(countStr);

        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, '\n');
    }
}
