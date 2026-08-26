import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildMembers;

export class GuildMembersSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildMembers',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
