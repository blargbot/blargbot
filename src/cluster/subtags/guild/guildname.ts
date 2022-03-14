import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class GuildNameSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'guildname',
            category: SubtagType.GUILD,
            desc: 'Returns the name of the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild\'s name is {guildname}.',
                    exampleOut: 'This guild\'s name is TestGuild.',
                    returns: 'string',
                    execute: (ctx) => this.getGuildName(ctx)
                }
            ]
        });
    }

    public getGuildName(context: BBTagContext): string {
        return context.guild.name;
    }
}
