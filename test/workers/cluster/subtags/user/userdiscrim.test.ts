import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserDiscrimSubtag } from '@cluster/subtags/user/userdiscrim';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserDiscrimSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['userdiscrim', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '1234',
                    setup(member) {
                        member.user.discriminator = '1234';
                    }
                },
                {
                    expected: '5678',
                    setup(member) {
                        member.user.discriminator = '5678';
                    }
                },
                {
                    expected: '0000',
                    setup(member) {
                        member.user.discriminator = '0000';
                    }
                }
            ]
        }),
        {
            code: '{userdiscrim;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 13, end: 19, error: new MarkerError('eval', 13) },
                { start: 20, end: 26, error: new MarkerError('eval', 20) },
                { start: 27, end: 33, error: new MarkerError('eval', 27) },
                { start: 0, end: 34, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
