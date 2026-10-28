import { GuildIdSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new GuildIdSubtag(),
    argCountBounds: { min: 0, max: 0 },
    names: ['guildId'],
    cases: [
        {
            code: '{guildid}',
            expected: '239874239478293234',
            setup(ctx) {
                ctx.guildId = '239874239478293234';
            }
        }
    ]
});
