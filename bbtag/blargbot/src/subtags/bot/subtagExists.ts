import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.subtagExists;

@Subtag.names('subtagExists')
@Subtag.ctorArgs()
export class SubtagExistsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['subtag'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [subtag]) => this.subtagExists(ctx, subtag.value)
                }
            ]
        });
    }

    public subtagExists(context: BBTagContext, name: string): boolean {
        try {
            context.getSubtag(name);
            return true;
        } catch {
            return false;
        }
    }
}
