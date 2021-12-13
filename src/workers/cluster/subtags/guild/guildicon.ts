import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildIcon extends Subtag {
    public constructor() {
        super({
            name: 'guildicon',
            category: SubtagType.GUILD,
            desc: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
            definition: [
                {
                    parameters: [],
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
