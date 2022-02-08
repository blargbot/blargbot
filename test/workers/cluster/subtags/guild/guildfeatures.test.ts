import { GuildFeaturesSubtag } from '@cluster/subtags/guild/guildfeatures';
import { GuildFeature } from 'discord-api-types';
import { Constants } from 'eris';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new GuildFeaturesSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildfeatures}',
            expected: JSON.stringify(Constants.GuildFeatures),
            setup(ctx) {
                ctx.guild.features = Constants.GuildFeatures as GuildFeature[];
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
