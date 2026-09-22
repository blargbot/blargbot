import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.guildOwnerIdReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{guildownerid}',
            expected: '2389476284936446234',
            setup(ctx) {
                ctx.guild.owner_id = '2389476284936446234';
            }
        }
    ]
});
