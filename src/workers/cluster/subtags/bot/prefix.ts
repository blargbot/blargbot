import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class PrefixSubtag extends BaseSubtag {
    public constructor() {
        super({
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
                        switch (typeof prefix) {
                            case 'string': return prefix;
                            case 'undefined': return ctx.engine.util.config.discord.defaultPrefix;
                            default: return prefix[0];
                        }
                    }
                }
            ]
        });
    }
}
