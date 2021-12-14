import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildNameSubtag extends Subtag {
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