import { randChoose } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class RandUserSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'randuser',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the id of a random user on the current guild.',
                    exampleCode: '{username;{randuser}} is a lovely person! {username;{randuser}} isn\'t as good.',
                    exampleOut: 'abalabahaha is a lovely person! stupid cat isn\'t as good.',
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
