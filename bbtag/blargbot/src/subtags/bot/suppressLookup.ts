import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotABooleanError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.suppressLookup;

@Subtag.id('suppressLookup')
@Subtag.ctorArgs('converter')
export class SuppressLookupSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['value?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [value]) => this.suppress(ctx, value.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public suppress(context: BBTagScript, value: string): void {
        let suppress: boolean | undefined = true;
        if (value !== '') {
            suppress = this.#converter.boolean(value);
            if (suppress === undefined)
                throw new NotABooleanError(value);
        }

        context.runtime.scopes.local.noLookupErrors = suppress;
    }
}
