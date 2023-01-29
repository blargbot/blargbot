import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildSize;

@Subtag.names('guildSize', 'inGuild')
@Subtag.ctorArgs(Subtag.service('user'))
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

    public async getMemberCount(context: BBTagContext): Promise<number> {
        const users = await this.#users.getAll(context);
        return users.filter(u => u.member !== undefined).length;
    }
}
