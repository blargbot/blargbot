import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.quiet;

@Subtag.id('quiet')
@Subtag.ctorArgs('converter')
export class QuietSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['isQuiet?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [quiet]) => this.setQuiet(ctx, quiet.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public setQuiet(context: BBTagScript, valueStr: string): void {
        context.runtime.scopes.local.quiet = this.#converter.boolean(valueStr);
    }
}
