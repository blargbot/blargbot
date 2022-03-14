import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { randChoose, SubtagType } from '@cluster/utils';

export class RandUserSubtag extends DefinedSubtag {
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

    public randomUser(context: BBTagContext): string {
        return randChoose(context.guild.members.values()).id;
    }
}
