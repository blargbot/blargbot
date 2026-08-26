import { RandomUserSubtag } from '@blargbot/bbtag/subtags/user/randomUser.js';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: new RandomUserSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{randuser}',
            assert(_, result, ctx) {
                expect(result).to.be.oneOf(Object.values(ctx.users).map(u => u.id));
            },
            postSetup(bbctx, ctx) {
                ctx.util.setup(m => m.ensureMemberCache(bbctx.guild)).thenResolve(undefined);
            }
        }
    ]
});
