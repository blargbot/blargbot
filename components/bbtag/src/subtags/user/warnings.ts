import type { GuildStore } from '@blargbot/domain/stores/GuildStore.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.warnings;

@Subtag.names('warnings')
@Subtag.ctorArgs(Subtag.store('guilds'), Subtag.service('user'))
export class WarningsSubtag extends CompiledSubtag {
    readonly #guilds: GuildStore;
    readonly #users: UserService;

    public constructor(guilds: GuildStore, users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (context, [user, quiet]) => this.getUserWarnings(context, user.value, quiet.value !== '')
                }
            ]
        });

        this.#guilds = guilds;
        this.#users = users;
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const user = await this.#users.querySingle(context, userQuery, { noLookup: quiet });

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await this.#guilds.getWarnings(context.guild.id, user.id) ?? 0;
    }
}
