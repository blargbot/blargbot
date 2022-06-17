import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class GuildIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildid',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the id of the current guild.',
                    exampleCode: 'The guild\'s id is {guildid}',
                    exampleOut: 'The guild\'s id is 1234567890123456',
                    returns: 'id',
                    execute: (ctx) => this.getGuildId(ctx)
                }
            ]
        });
    }

    public getGuildId(context: BBTagContext): string {
        return context.guild.id;
    }
}
