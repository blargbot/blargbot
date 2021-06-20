import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildBansSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildbans',
            category: SubtagType.API,
            desc: 'Returns an array of banned users in the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This guild has {length;{guildbans}} banned users.',
                    exampleOut: 'This guild has 123 banned users.',
                    execute: (ctx, _, subtag) => this.getGuildBans(ctx, subtag)
                }
            ]
        })
    }

    public async getGuildBans(
        context: BBTagContext,
        subtag: SubtagCall
    ): Promise<string> {
        try {
            return JSON.stringify((await context.guild.getBans()).map(u => u.user.id));
        } catch (err) {
            return this.customError('Missing required permissions', context, subtag);
        }
    }
}