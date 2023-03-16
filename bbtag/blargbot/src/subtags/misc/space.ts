import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.space;

@Subtag.id('space', 's')
@Subtag.ctorArgs('converter')
export class SpaceSubtag extends CompiledSubtag {
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
                    execute: (ctx, [count]) => this.getSpaces(ctx, count.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public getSpaces(context: BBTagScript, countStr: string): string {
        const count = this.#converter.int(countStr) ?? this.#converter.int(context.runtime.scopes.local.fallback ?? '');
        if (count === undefined)
            throw new NotANumberError(countStr);

        // TODO: limit count
        return ''.padStart(count < 0 ? 0 : count, ' ');
    }
}
