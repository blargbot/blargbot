import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class SubtagExistsSubtag extends Subtag {
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
