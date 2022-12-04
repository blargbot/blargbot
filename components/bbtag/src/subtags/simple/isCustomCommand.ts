import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.isCustomCommand;

export class IsCustomCommandSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isCustomCommand',
            aliases: ['isCC'],
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

    public isCC(context: BBTagContext): boolean {
        return context.isCC;
    }
}
