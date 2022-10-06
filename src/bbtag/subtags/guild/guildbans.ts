import { DiscordRESTError } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class GuildBansSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `guildbans`,
            category: SubtagType.GUILD,
            definition: [
                {
                    parameters: [],
                    description: `Returns an array of banned users in the current guild.`,
                    exampleCode: `This guild has {length;{guildbans}} banned users.`,
                    exampleOut: `This guild has 123 banned users.`,
                    returns: `id[]`,
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

            throw new BBTagRuntimeError(`Missing required permissions`, err.message);
        }
    }
}
