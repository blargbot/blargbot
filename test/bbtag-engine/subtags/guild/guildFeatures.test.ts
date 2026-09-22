import { replacers } from '@blargbot/bbtag-engine';
import type { GuildFeature } from 'discord-api-types/v9';
import * as eris from 'eris';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.guildFeaturesReplacer,
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
