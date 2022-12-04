import { GuildFeaturesSubtag } from '@blargbot/bbtag/subtags/guild/guildFeatures.js';
import Discord from 'discord-api-types/v9';
import * as Eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new GuildFeaturesSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildfeatures}',
            expected: JSON.stringify(Eris.Constants.GuildFeatures),
            setup(ctx) {
                ctx.guild.features = Eris.Constants.GuildFeatures as Discord.GuildFeature[];
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
