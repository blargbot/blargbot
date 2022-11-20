import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { BBTagRuntimeError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.guildBans;

export class GuildBansSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildBans',
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
    }

    public async getGuildBans(context: BBTagContext): Promise<string[]> {
        try {
            return await context.util.getBannedUsers(context.guild);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Missing required permissions', err.message);
        }
    }
}
