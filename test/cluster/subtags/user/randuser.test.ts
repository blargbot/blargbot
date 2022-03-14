import { RandUserSubtag } from '@blargbot/cluster/subtags/user/randuser';
import { expect } from 'chai';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RandUserSubtag(),
    argCountBounds: { min: 0, max: 0 },
    cases: [
        {
            code: '{randuser}',
            assert(_, result, ctx) {
                expect(result).to.be.oneOf(Object.values(ctx.users).map(u => u.id));
            }
        }
    ]
});
