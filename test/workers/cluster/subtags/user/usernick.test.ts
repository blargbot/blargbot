import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserNickSubtag } from '@cluster/subtags/user/usernick';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserNickSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            generateCode(...args) {
                return `{${['usernick', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'cooldood69',
                    setup(member) {
                        member.nick = 'cooldood69';
                    }
                },
                {
                    expected: 'aaaaaaaa',
                    setup(member) {
                        member.nick = 'aaaaaaaa';
                    }
                },
                {
                    queryString: '123456789098765432',
                    expected: 'nice',
                    setup(member) {
                        member.nick = null;
                        member.user.username = 'nice';
                        member.user.id = '123456789098765432';
                    }
                },
                {
                    queryString: '98765432234567890243',
                    expected: 'asdfgh',
                    setup(member) {
                        member.nick = undefined;
                        member.user.username = 'asdfgh';
                        member.user.id = '98765432234567890243';
                    }
                }
            ]
        }),
        {
            code: '{usernick;{eval};{eval};{eval}}',
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
