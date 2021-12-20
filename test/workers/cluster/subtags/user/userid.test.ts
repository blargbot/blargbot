import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserIdSubtag } from '@cluster/subtags/user/userid';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserIdSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userid', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '12345678900987236',
                    setup(member) {
                        member.user.id = '12345678900987236';
                    }
                },
                {
                    expected: '098765434512212678',
                    setup(member) {
                        member.user.id = '098765434512212678';
                    }
                },
                {
                    expected: '876543456782978367654',
                    setup(member) {
                        member.user.id = '876543456782978367654';
                    }
                }
            ]
        }),
        {
            code: '{userid;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 8, end: 14, error: new MarkerError('eval', 8) },
                { start: 15, end: 21, error: new MarkerError('eval', 15) },
                { start: 22, end: 28, error: new MarkerError('eval', 22) },
                { start: 0, end: 29, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
