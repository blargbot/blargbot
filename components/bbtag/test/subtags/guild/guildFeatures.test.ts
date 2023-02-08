import { Subtag } from '@bbtag/blargbot';
import { GuildFeaturesSubtag } from '@bbtag/blargbot/subtags';
import Discord from 'discord-api-types/v10';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildFeaturesSubtag),
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
