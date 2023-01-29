import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.guildBans;

@Subtag.names('guildBans')
@Subtag.ctorArgs(Subtag.service('user'))
export class GuildBansSubtag extends CompiledSubtag {
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
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildBans(ctx)
                }
            ]
        });

        this.#users = users;
    }

    public async getGuildBans(context: BBTagContext): Promise<string[]> {
        const users = await this.#users.findBanned(context);
        if (users === 'noPerms')
            throw new BBTagRuntimeError('Missing required permissions');

        return users;
    }
}
