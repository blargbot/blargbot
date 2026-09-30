import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.dumpReplacer,
    names: ['dump'],
    argCountBounds: { min: 1, max: 1 },
    cases: [
        {
            code: '{dump;abc123}',
            expected: 'https://blargbot.xyz/dumps/1271927912712712',
            setup(ctx) {
                ctx.locals.setup(m => m.dump('abc123')).returns(new URL('https://blargbot.xyz/dumps/1271927912712712')).mustHappen(1);
            }
        }
    ]
});
