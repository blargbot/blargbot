import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildMembersSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildmembers',
            category: SubtagType.API,
            desc: 'Returns an array of user IDs of the members on the current guild. This only includes **cached** members, for getting the amount of members in a guild **always** use `{guildsize}`',
            definition: [
                {
                    args: [],
                    exampleCode: 'This guild has {length;{guildmembers}} members.',
                    exampleOut: 'This guild has 123 members.',
                    execute: (ctx) => JSON.stringify(ctx.guild.members.map(m => m.user.id))
                }
            ]
        });
    }
}