import { BBTagRuntimeError, Subtag  } from '@blargbot/bbtag';
import { UserTimeoutSubtag } from '@blargbot/bbtag/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(UserTimeoutSubtag),
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{usertimeout}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                ctx.users.command.member.communication_disabled_until = '2021-01-01T00:00:00+0000';
            }
        },
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimeout', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = '2021-12-20T15:12:37+00:00';
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = null;
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = undefined;
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimeout', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = '2021-01-01T00:00:00+0000';
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = '2021-12-20T15:12:37+00:00';
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = null;
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(member) {
                        if (member.member === undefined)
                            throw new Error('User isnt member of guild');
                        member.member.communication_disabled_until = undefined;
                    }
                }
            ]
        })
    ]
});