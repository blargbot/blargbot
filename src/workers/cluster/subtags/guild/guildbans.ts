import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class GuildBansSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildbans',
            category: SubtagType.GUILD,
            desc: 'Returns an array of banned users in the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{guildbans}} banned users.',
                    exampleOut: 'This guild has 123 banned users.',
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildBans(ctx)
                }
            ]
        });
    }

    public async getGuildBans(
        context: BBTagContext
    ): Promise<string[]> {
        try {
            return (await context.guild.getBans()).map(u => u.user.id);
        } catch (err: unknown) {
            throw new BBTagRuntimeError('Missing required permissions');
        }
    }
}
