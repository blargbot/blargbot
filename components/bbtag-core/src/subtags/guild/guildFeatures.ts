import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class GuildFeaturesSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildFeatures',
            category: SubtagType.GUILD,
            aliases: ['features'],
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx) => this.getGuildFeatures(ctx)
                }
            ]
        });
    }

    public getGuildFeatures(
        context: BBTagContext
    ): string[] {
        return context.guild.features;
    }
}
