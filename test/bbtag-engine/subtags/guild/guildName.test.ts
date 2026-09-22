import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.guildNameReplacer,
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
