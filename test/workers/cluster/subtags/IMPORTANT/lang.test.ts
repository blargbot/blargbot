import { NotEnoughArgumentsError, TooManyArgumentsError } from '@cluster/bbtag/errors';
import { LangSubtag } from '@cluster/subtags/IMPORTANT/lang';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';

runSubtagTests({
    subtag: new LangSubtag(),
    cases: [
        {
            code: '{lang}',
            expected: '`Not enough arguments`',
            errors: [
                { start: 0, end: 6, error: new NotEnoughArgumentsError(1, 0) }
            ]
        },
        { code: '{lang;}', expected: '' },
        { code: '{lang;abc}', expected: '' },
        {
            code: '{lang;{eval}}',
            expected: '',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) }
            ]
        },
        {
            code: '{lang;{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 6, end: 12, error: new MarkerError('eval', 6) },
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 0, end: 20, error: new TooManyArgumentsError(1, 2) }
            ]
        }
    ]
});
