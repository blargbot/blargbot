import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserIsBotSubtag } from '@cluster/subtags/user/userisbot';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserIsBotSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userisbot', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(member) {
                        member.user.bot = true;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = false;
                    }
                },
                {
                    expected: 'false',
                    setup(member) {
                        member.user.bot = undefined;
                    }
                }
            ]
        }),
        {
            code: '{userisbot;{eval};{eval};{eval}}',
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
