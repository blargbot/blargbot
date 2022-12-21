import { randChoose } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class RandomUserSubtag extends Subtag {
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
