import type { GetUserTimezoneThunk } from '@blargbot/bbtag/subtags';
import { UserTimezoneSubtag } from '@blargbot/bbtag/subtags';
import { Mock } from '@blargbot/test-util';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

const getUserTimezone = new Mock<GetUserTimezoneThunk>({ id: 'getUserTimezone', callable: true });

await runSubtagTests({
    subtag: new UserTimezoneSubtag({
        getUserTimezone: getUserTimezone.instance
    }),
    argCountBounds: { min: 0, max: 2 },
    names: ['userTimeZone'],
    setup(ctx) {
        ctx.addMock(getUserTimezone);
        getUserTimezone.reset();
    },
    cases: [
        ...createGetUserPropTestCases({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimezone', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'UTC',
                    setup(member) {
                        getUserTimezone.setup(m => m(member.user.id)).resolves(undefined);
                    }
                },
                {
                    expected: 'abc',
                    setup(member) {
                        getUserTimezone.setup(m => m(member.user.id)).resolves('abc');
                    }
                },
                {
                    expected: 'Etc/UTC',
                    setup(member) {
                        getUserTimezone.setup(m => m(member.user.id)).resolves('Etc/UTC');
                    }
                }
            ]
        })
    ]
});
