import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildSize;

@Subtag.id('guildSize', 'inGuild')
@Subtag.ctorArgs('users')
export class GuildSizeSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx) => this.getMemberCount(ctx)
                }
            ]
        });

        this.#users = users;
    }

    public async getMemberCount(context: BBTagScript): Promise<number> {
        const users = await this.#users.getAll(context.runtime);
        return users.filter(u => u.member !== undefined).length;
    }
}
