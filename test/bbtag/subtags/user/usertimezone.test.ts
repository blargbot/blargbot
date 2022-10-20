import { UserTimezoneSubtag } from '@blargbot/bbtag/subtags/user/usertimezone';

import { runSubtagTests } from '../SubtagTestSuite';
import { createGetUserPropTestCases } from './_getUserPropTest';

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
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve(undefined);
                    }
                },
                {
                    expected: 'abc',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve('abc');
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(member, ctx) {
                        ctx.userTable.setup(m => m.getSetting(member.user.id, 'timezone')).thenResolve('Etc/UTC');
                    }
                }
            ]
        })
    ]
});
