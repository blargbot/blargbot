import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class GuildIconSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildIcon',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
