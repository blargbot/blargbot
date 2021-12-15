import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class MembersSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'Members',
            category: SubtagType.GUILD,
            desc: 'Returns an array of user IDs of the members on the current guild. This only includes **cached** members, for getting the amount of members in a guild **always** use `{guildsize}`',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{Members}} members.',
                    exampleOut: 'This guild has 123 members.',
                    returns: 'id[]',
                    execute: (ctx) => this.getMembers(ctx)
                }
            ]
        });
    }

    public getMembers(context: BBTagContext): string[] {
        return context.guild.members.map(m => m.user.id);
    }
}
