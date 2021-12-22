import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { RandUserSubtag } from '@cluster/subtags/user/randuser';
import { expect } from 'chai';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new RandUserSubtag(),
    cases: [
        {
            code: '{randuser}',
            assert(_, result, ctx) {
                expect(result).to.be.oneOf(Object.values(ctx.users).map(u => u.id));
            }
        },
        {
            code: '{randuser;{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 0, end: 17, error: new TooManyArgumentsError(0, 1) }
            ]
        }
    ]
});
