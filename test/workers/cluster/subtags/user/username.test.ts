import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserNameSubtag } from '@cluster/subtags/user/username';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserNameSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['username', ...args].join(';')}}`;
            },
            cases: [
                {
                    queryString: '09876509876543211234',
                    expected: 'abcdef',
                    setup(member) {
                        member.user.id = '09876509876543211234';
                        member.user.username = 'abcdef';
                    }
                },
                {
                    queryString: '09876509876543211234',
                    expected: 'oooh nice username',
                    setup(member) {
                        member.user.id = '09876509876543211234';
                        member.user.username = 'oooh nice username';
                    }
                }
            ]
        }),
        {
            code: '{username;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 10, end: 16, error: new MarkerError('eval', 10) },
                { start: 17, end: 23, error: new MarkerError('eval', 17) },
                { start: 24, end: 30, error: new MarkerError('eval', 24) },
                { start: 0, end: 31, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
