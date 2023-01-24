import type { GuildStore } from '@blargbot/domain/stores/GuildStore.js';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.warnings;

@Subtag.id('warnings')
@Subtag.factory(Subtag.store('guilds'))
export class WarningsSubtag extends CompiledSubtag {
    readonly #guilds: GuildStore;

    public constructor(guilds: GuildStore) {
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
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const user = await context.queryUser(userQuery, { noLookup: quiet });

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await this.#guilds.getWarnings(context.guild.id, user.id) ?? 0;
    }
}
