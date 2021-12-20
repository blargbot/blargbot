import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserRolesSubtag } from '@cluster/subtags/user/userroles';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserRolesSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userroles', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '[]',
                    setup(member) {
                        member.roles = [];
                    }
                },
                {
                    expected: '["098765434512212678"]',
                    setup(member) {
                        member.roles = ['098765434512212678'];
                    }
                },
                {
                    expected: '["098765434512212678","1234567890987654"]',
                    setup(member) {
                        member.roles = ['098765434512212678', '1234567890987654'];
                    }
                }
            ]
        }),
        {
            code: '{userroles;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 11, end: 17, error: new MarkerError('eval', 11) },
                { start: 18, end: 24, error: new MarkerError('eval', 18) },
                { start: 25, end: 31, error: new MarkerError('eval', 25) },
                { start: 0, end: 32, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
