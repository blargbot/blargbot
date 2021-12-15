import { NotANumberError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { NewlineSubtag } from '@cluster/subtags/misc/newline';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new NewlineSubtag(),
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
        },
        {
            code: '{newline;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 9, end: 15, error: new MarkerError('eval', 9) },
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 0, end: 23, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
