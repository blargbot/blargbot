import { GuildFeaturesSubtag } from '@bbtag/blargbot/subtags';
import Discord from '@blargbot/discord-types';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: GuildFeaturesSubtag,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildfeatures}',
            expected: JSON.stringify(Object.values(Discord.GuildFeature)),
            setup(ctx) {
                ctx.guild.features = Object.values(Discord.GuildFeature);
            }
        },
        {
            code: '{guildfeatures}',
            expected: '[]',
            setup(ctx) {
                ctx.guild.features = [];
            }
        }
    ]
});
