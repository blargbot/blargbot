import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildOwnerId;

@Subtag.id('guildOwnerId')
@Subtag.ctorArgs()
export class GuildOwnerIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getGuildOwnerId(ctx)
                }
            ]
        });
    }

    public getGuildOwnerId(context: BBTagScript): string {
        return context.runtime.guild.owner_id;
    }
}
