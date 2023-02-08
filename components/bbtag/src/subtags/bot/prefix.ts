import type { GuildStore } from '@blargbot/domain/stores/GuildStore.js';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.prefix;

@Subtag.names('prefix')
@Subtag.ctorArgs(Subtag.util(), Subtag.store('guilds'))
export class PrefixSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #guilds: GuildStore;

    public constructor(util: BBTagUtilities, guilds: GuildStore) {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getPrefix(ctx)
                }
            ]
        });

        this.#util = util;
        this.#guilds = guilds;
    }

    public async getPrefix(context: BBTagContext): Promise<string> {
        if (context.prefix !== undefined)
            return context.prefix;

        const prefix = await this.#guilds.getSetting(context.guild.id, 'prefix');
        switch (typeof prefix) {
            case 'string': return prefix;
            case 'undefined': return this.#util.defaultPrefix;
            default: return prefix[0];
        }
    }
}
