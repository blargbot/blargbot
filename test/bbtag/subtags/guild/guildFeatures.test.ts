import { GuildFeaturesSubtag } from '@blargbot/bbtag/subtags/guild/guildFeatures.js';
import type { GuildFeature } from 'discord-api-types/v9';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new GuildFeaturesSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildfeatures}',
            expected: JSON.stringify(eris.Constants.GuildFeatures),
            setup(ctx) {
                ctx.guild.features = eris.Constants.GuildFeatures as GuildFeature[];
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
