import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class GuildIconSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildicon',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
                    exampleCode: 'The guild\'s icon is {guildicon}',
                    exampleOut: 'The guild\'s icon is (icon url)',
                    returns: 'string|nothing',
                    execute: (ctx) => this.getGuildIcon(ctx)
                }
            ]
        });
    }

    public getGuildIcon(context: BBTagContext): string | undefined {
        return context.guild.iconURL ?? undefined;
    }
}
