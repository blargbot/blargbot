import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.guildMembers;

@Subtag.names('guildMembers')
@Subtag.ctorArgs(Subtag.service('user'))
export class GuildMembersSubtag extends CompiledSubtag {
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
                    execute: (ctx) => this.getMembers(ctx)
                }
            ]
        });

        this.#users = users;
    }

    public async getMembers(context: BBTagContext): Promise<string[]> {
        const users = await this.#users.getAll(context);
        return users.filter(u => u.member !== undefined).map(u => u.id);
    }
}
