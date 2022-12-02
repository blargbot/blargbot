import { UserTimezoneSubtag } from '@blargbot/bbtag/subtags/user/userTimeZone.js';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: new UserTimezoneSubtag(),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimezone', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'UTC',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getProp(member.user.id, 'timezone')).thenResolve(undefined);
                    }
                },
                {
                    expected: 'abc',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getProp(member.user.id, 'timezone')).thenResolve('abc');
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getProp(member.user.id, 'timezone')).thenResolve('Etc/UTC');
                    }
                }
            ]
        })
    ]
});
