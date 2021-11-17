import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class RandUserSubtag extends Subtag {
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
        const members = context.guild.members.cache.map(m => m.id);
        return members[Math.floor(Math.random() * members.length)];
    }
}
