import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

export class GuildSizeSubtag extends Subtag {
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
