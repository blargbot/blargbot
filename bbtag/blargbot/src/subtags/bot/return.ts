import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.return;

@Subtag.id('return')
@Subtag.ctorArgs('converter')
export class ReturnSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['force?:true'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (context, [forcedStr]) => this.setReturn(context, forcedStr.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public setReturn(context: BBTagScript, forcedStr: string): void {
        const forced = this.#converter.boolean(forcedStr, true);
        context.runtime.state = forced ? BBTagRuntimeState.ABORT : BBTagRuntimeState.RETURN;
    }
}
