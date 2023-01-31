import { images } from '@blargbot/discord-util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildIcon;

@Subtag.names('guildIcon')
@Subtag.ctorArgs()
export class GuildIconSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
        return images.guildIcon(context.guild) ?? undefined;
    }
}
