import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildOwnerId;

export class GuildOwnerIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildOwnerId',
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

    public getGuildOwnerId(context: BBTagContext): string {
        return context.guild.ownerID;
    }
}
