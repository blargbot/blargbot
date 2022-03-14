import { NotANumberError } from '@blargbot/cluster/bbtag/errors';
import { NewlineSubtag } from '@blargbot/cluster/subtags/misc/newline';

import { runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new NewlineSubtag(),
    argCountBounds: { min: 0, max: 1 },
    cases: [
        { code: '{newline}', expected: '\n' },
        { code: '{newline;}', expected: '\n' },
        { code: '{newline;0}', expected: '' },
        { code: '{newline;-3}', expected: '' },
        { code: '{newline;5}', expected: '\n\n\n\n\n' },
        {
            code: '{newline;a}',
            expected: '\n\n\n',
            setup(ctx) { ctx.rootScope.fallback = '3'; }
        },
        {
            code: '{newline;a}',
            expected: '`Not a number`',
            errors: [
                { start: 0, end: 11, error: new NotANumberError('a') }
            ]
        }
    ]
});
