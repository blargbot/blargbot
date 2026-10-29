import { NotANumberError } from '@blargbot/bbtag';
import { NewlineSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';

await runSubtagTests({
    subtag: new NewlineSubtag(),
    argCountBounds: { min: 0, max: 1 },
    names: ['newline', 'n'],
    cases: [
        { code: '{newline}', expected: '\n' },
        { code: '{newline;}', expected: '\n' },
        { code: '{newline;0}', expected: '' },
        { code: '{newline;-3}', expected: '' },
        { code: '{newline;5}', expected: '\n\n\n\n\n' },
        {
            code: '{newline;a}',
            expected: '\n\n\n',
            setup(ctx) { ctx.bbtag.root.fallback = '3'; }
        },
        {
            code: '{newline;a}',
            expected: '`Not a number`',
            errors: [
                { error: new NotANumberError('a') }
            ]
        }
    ]
});
