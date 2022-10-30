import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.guildId;

export class GuildIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildId',
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
