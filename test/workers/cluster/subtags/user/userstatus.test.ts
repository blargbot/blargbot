import { TooManyArgumentsError } from '@cluster/bbtag/errors';
import { UserStatusSubtag } from '@cluster/subtags/user/userstatus';

import { MarkerError, runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

runSubtagTests({
    subtag: new UserStatusSubtag(),
    cases: [
        ...createGetUserPropTestCases({
            ifQuietAndNotFound: '',
            generateCode(...args) {
                return `{${['userstatus', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'dnd',
                    postSetup(member) {
                        member.update({
                            status: 'dnd'
                        });
                    }
                },
                {
                    expected: 'idle',
                    postSetup(member) {
                        member.update({
                            status: 'idle'
                        });
                    }
                },
                {
                    expected: 'offline',
                    postSetup(member) {
                        member.update({
                            status: 'offline'
                        });
                    }
                },
                {
                    expected: 'online',
                    postSetup(member) {
                        member.update({
                            status: 'online'
                        });
                    }
                }
            ]
        }),
        {
            code: '{userstatus;{eval};{eval};{eval}}',
            expected: '`Too many arguments`',
            errors: [
                { start: 12, end: 18, error: new MarkerError('eval', 12) },
                { start: 19, end: 25, error: new MarkerError('eval', 19) },
                { start: 26, end: 32, error: new MarkerError('eval', 26) },
                { start: 0, end: 33, error: new TooManyArgumentsError(2, 3) }
            ]
        }
    ]
});
