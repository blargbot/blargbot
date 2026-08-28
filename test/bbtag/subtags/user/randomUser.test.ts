import assert from 'node:assert/strict';

import { RandomUserSubtag } from '@blargbot/bbtag/subtags/user/randomUser.js';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new RandomUserSubtag(),
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
