import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildfeatures;

export class GuildFeaturesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildfeatures',
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
