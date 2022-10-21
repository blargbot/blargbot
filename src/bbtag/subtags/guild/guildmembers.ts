import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildmembers;

export class GuildMembersSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildmembers',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of user IDs of the members on the current guild. This only includes **cached** members, for getting the amount of members in a guild **always** use `{guildsize}`',
                    exampleCode: 'This guild has {length;{guildmembers}} members.',
                    exampleOut: 'This guild has 123 members.',
                    returns: 'id[]',
                    execute: (ctx) => this.getMembers(ctx)
                }
            ]
        });
    }

    public async getMembers(context: BBTagContext): Promise<string[]> {
        await context.util.ensureMemberCache(context.channel.guild);
        return context.guild.members.map(m => m.user.id);
    }
}
