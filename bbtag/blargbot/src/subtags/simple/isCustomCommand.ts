import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.isCustomCommand;

@Subtag.id('isCustomCommand', 'isCC')
@Subtag.ctorArgs()
export class IsCustomCommandSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx) => this.isCC(ctx)
                }
            ]
        });
    }

    public isCC(context: BBTagScript): boolean {
        return context.runtime.isCC;
    }
}
