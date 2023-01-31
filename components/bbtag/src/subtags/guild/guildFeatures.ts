import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildFeatures;

@Subtag.names('guildFeatures', 'features')
@Subtag.ctorArgs()
export class GuildFeaturesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.GUILD,
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
