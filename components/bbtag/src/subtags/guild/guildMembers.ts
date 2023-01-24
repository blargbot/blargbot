import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildMembers;

@Subtag.id('guildMembers')
@Subtag.factory(Subtag.util())
export class GuildMembersSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
        super({
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getMembers(ctx)
                }
            ]
        });

        this.#util = util;
    }

    public async getMembers(context: BBTagContext): Promise<string[]> {
        await this.#util.ensureMemberCache(context.channel.guild);
        return context.guild.members.map(m => m.user.id);
    }
}
