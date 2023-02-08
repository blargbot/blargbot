import { Subtag } from '@bbtag/blargbot';
import { GuildNameSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(GuildNameSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildname}',
            expected: 'My super cool guild',
            setup(ctx) {
                ctx.guild.name = 'My super cool guild';
            }
        }
    ]
});
