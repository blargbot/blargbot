import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.subtagExists;

export class SubtagExistsSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'subtagExists',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['subtag'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [subtag]) => ctx.subtags.get(subtag.value) !== undefined
                }
            ]
        });
    }
}
