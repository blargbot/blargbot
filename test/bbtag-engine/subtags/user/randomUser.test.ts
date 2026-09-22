import assert from 'node:assert/strict';

import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    replacer: replacers.randomUserReplacer,
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{randuser}',
            assert(_, result, ctx) {
                assert(Object.values(ctx.users).map(u => u.id).includes(result));
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve(undefined);
            }
        }
    ]
});
