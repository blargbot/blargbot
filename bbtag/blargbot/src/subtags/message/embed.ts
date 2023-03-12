import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.embed;

@Subtag.names('embed')
@Subtag.ctorArgs('converter')
export class EmbedSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['embed+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, embeds) => this.setEmbed(ctx, embeds.map(e => e.value))
                }
            ]
        });

        this.#converter = converter;
    }

    public setEmbed(context: BBTagContext, embedStr: string[]): void {
        context.data.embeds = embedStr.flatMap(e => this.#converter.embed(e, { allowMalformed: true }) ?? []);
    }
}
