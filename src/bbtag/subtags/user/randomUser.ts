import { randChoose } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.randomUser;

export class RandomUserSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randomUser',
            aliases: ['randUser'],
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
    }

    public async randomUser(context: BBTagContext): Promise<string> {
        await context.util.ensureMemberCache(context.channel.guild);
        return randChoose(context.guild.members.values()).id;
    }
}
