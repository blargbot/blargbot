import { parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class HereMentionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'hereMention',
            aliases: ['here'],
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['mention?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [mention]) => this.hereMention(ctx, mention.value)
                }
            ]
        });
    }

    public hereMention(
        context: BBTagContext,
        mention: string
    ): string {
        const enabled = parse.boolean(mention, true);
        context.data.allowedMentions.everybody = enabled;
        return '@here';
    }
}
