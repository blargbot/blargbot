import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class GuildMembersSubtag extends Subtag {
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
