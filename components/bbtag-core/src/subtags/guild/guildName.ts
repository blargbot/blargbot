import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class GuildNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildName',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
