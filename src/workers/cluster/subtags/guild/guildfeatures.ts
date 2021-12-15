import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildFeaturesSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'guildfeatures',
            category: SubtagType.GUILD,
            aliases: ['features'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns an array of guild feature strings. For a full list click [this link](https://discord.com/developers/docs/resources/guild#guild-object-guild-features).',
                    exampleCode: '{guildfeatures}',
                    exampleOut: '["COMMUNITY","COMMERCE","NEWS","PREVIEW_ENABLED","WELCOME_SCREEN_ENABLED","MEMBER_VERIFICATION_GATE_ENABLED","THREADS_ENABLED"]',
                    returns: 'string[]',
                    execute: (ctx) => this.getGuildFeatures(ctx)
                }
            ]
        });
    }

    public getGuildFeatures(
        context: BBTagContext
    ): string[] {
        return context.guild.features;
    }
}
