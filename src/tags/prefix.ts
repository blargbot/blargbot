
import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class PrefixSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'prefix',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the current guild\'s prefix.',
                    exampleCode: 'Your prefix is {prefix}',
                    exampleOut: 'Your prefix is b!',
                    execute: async (ctx) => {
                        const prefix = await ctx.database.guilds.getSetting(ctx.guild.id, 'prefix');
                        return (Array.isArray(prefix) ? prefix[0] : prefix) || ctx.engine.util.config.discord.defaultPrefix;
                    }
                }
            ]
        });
    }
}