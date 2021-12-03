import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildMembersSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildmembers',
            category: SubtagType.GUILD,
            desc: 'Returns an array of user IDs of the members on the current guild. This only includes **cached** members, for getting the amount of members in a guild **always** use `{guildsize}`',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{guildmembers}} members.',
                    exampleOut: 'This guild has 123 members.',
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildMembers(ctx)
                }
            ]
        });
    }

    public getGuildMembers(context: BBTagContext): string[] {
        return context.guild.members.cache.map(m => m.user.id);
    }
}
