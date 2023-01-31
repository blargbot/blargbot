import { NotANumberError, Subtag  } from '@blargbot/bbtag';
import { NewlineSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(NewlineSubtag),
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
