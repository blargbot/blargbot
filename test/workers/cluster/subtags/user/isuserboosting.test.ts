import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { IsUserBoostingSubtag } from '@cluster/subtags/user/isuserboosting';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new IsUserBoostingSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['isuserboosting', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(user) {
                        user.premium_since = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        user.premium_since = null;
                    }
                },
                {
                    expected: 'false',
                    setup(user) {
                        user.premium_since = undefined;
                    }
                }
            ]
        }),
        {
            code: '{isuserboosting;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 16, end: 22, error: new MarkerError('eval', 16) },
                { start: 23, end: 29, error: new MarkerError('eval', 23) },
                { start: 30, end: 36, error: new MarkerError('eval', 30) },
                { start: 0, end: 37, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
