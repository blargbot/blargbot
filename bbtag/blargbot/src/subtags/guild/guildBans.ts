import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildBans;

@Subtag.id('guildBans')
@Subtag.ctorArgs('users')
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

    public async getGuildBans(context: BBTagScript): Promise<string[]> {
        const users = await this.#users.findBanned(context.runtime);
        if (users === 'noPerms')
            throw new BBTagRuntimeError('Missing required permissions');

        return users;
    }
}
