import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.everyoneMention;

@Subtag.names('everyoneMention', 'everyone')
@Subtag.ctorArgs(Subtag.converter())
export class EveryoneMentionSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['mention?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [mention]) => this.everyoneMention(ctx, mention.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public everyoneMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = this.#converter.boolean(mention, true);
        context.data.allowedMentions.everybody = enabled;

        return '@everyone';
    }
}