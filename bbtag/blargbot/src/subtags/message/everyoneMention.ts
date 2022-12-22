import { parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class EveryoneMentionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'everyoneMention',
            aliases: ['everyone'],
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
    }

    public everyoneMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = parse.boolean(mention, true);
        context.data.allowedMentions.everybody = enabled;

        return '@everyone';
    }
}
