import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildsize;

export class GuildSizeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildsize',
            aliases: ['inguild'],
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the number of members on the current guild.',
                    exampleCode: 'This guild has {guildsize} members.',
                    exampleOut: 'This guild has 123 members.',
                    returns: 'number',
                    execute: (ctx) => this.getMemberCount(ctx)
                }
            ]
        });
    }

    public async getMemberCount(context: BBTagContext): Promise<number> {
        await context.util.ensureMemberCache(context.guild);
        return context.guild.members.size;
    }
}
