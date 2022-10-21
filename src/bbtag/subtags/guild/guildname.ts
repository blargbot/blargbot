import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildname;

export class GuildNameSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildname',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the name of the current guild.',
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
