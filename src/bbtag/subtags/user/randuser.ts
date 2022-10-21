import { randChoose } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.randuser;

export class RandUserSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randuser',
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
