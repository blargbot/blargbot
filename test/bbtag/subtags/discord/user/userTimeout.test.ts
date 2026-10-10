import type { GuildMemberTimeoutLocals } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userTimeoutReplacer,
    names: ['userTimeout', 'timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{usertimeout}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                ctx.discord.setup((m, $) => m.queryUser('', $({ quiet: true, throw: UserNotFoundError.withQuiet(true, '') }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(Date.UTC(2021, 0, 1)).mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberTimeoutLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['usertimeout', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(Date.UTC(2021, 0, 1)).mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(Date.UTC(2021, 11, 20, 15, 12, 37)).mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberTimeoutLocals>({
            quiet: '',
            quietNoArgs: true,
            generateCode(...args) {
                return `{${['usertimeout', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(Date.UTC(2021, 0, 1)).mustHappen(1);
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(Date.UTC(2021, 11, 20, 15, 12, 37)).mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getUserTimeout(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
