import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.guildSize;

export class GuildSizeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildSize',
            aliases: ['inGuild'],
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
