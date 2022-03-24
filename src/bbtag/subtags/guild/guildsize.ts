import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class GuildSizeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildsize',
            aliases: ['inguild'],
            category: SubtagType.GUILD,
            desc: 'Returns the number of members on the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {guildsize} members.',
                    exampleOut: 'This guild has 123 members.',
                    returns: 'number',
                    execute: (ctx) => this.getMemberCount(ctx)
                }
            ]
        });
    }

    public getMemberCount(context: BBTagContext): number {
        return context.guild.memberCount;
    }
}
