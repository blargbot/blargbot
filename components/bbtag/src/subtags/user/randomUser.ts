import { randChoose } from '@blargbot/core/utils/index.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.randomUser;

@Subtag.id('randomUser', 'randUser')
@Subtag.factory(Subtag.util())
export class RandomUserSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: ctx => this.randomUser(ctx)
                }
            ]
        });
        this.#util = util;
    }

    public async randomUser(context: BBTagContext): Promise<string> {
        await this.#util.ensureMemberCache(context.channel.guild);
        return randChoose(context.guild.members.values()).id;
    }
}
