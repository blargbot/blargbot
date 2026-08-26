import { parse } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.hereMention;

export class HereMentionSubtag extends CompiledSubtag {
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
