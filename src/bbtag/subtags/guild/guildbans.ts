import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.guildbans;

export class GuildBansSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'guildbans',
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
            return (await context.guild.getBans()).map(u => u.user.id);
        } catch (err: unknown) {
            if (!(err instanceof DiscordRESTError))
                throw err;

            throw new BBTagRuntimeError('Missing required permissions', err.message);
        }
    }
}
