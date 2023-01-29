import { Subtag } from '@blargbot/bbtag';
import { RandomUserSubtag } from '@blargbot/bbtag/subtags/user/randomUser.js';
import chai from 'chai';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(RandomUserSubtag),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{randuser}',
            assert(_, result, ctx) {
                chai.expect(result).to.be.oneOf(Object.values(ctx.users).map(u => u.id));
            },
            postSetup(bbctx, ctx) {
                ctx.userService.setup(m => m.getAll(bbctx)).verifiable(1).thenResolve(Object.values(ctx.users));
            }
        }
    ]
});
