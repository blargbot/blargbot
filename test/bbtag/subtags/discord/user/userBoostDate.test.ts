import type { GuildMemberBoostingLocals, TemporalValue } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userBoostDateReplacer,
    names: ['userBoostDate'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userboostdate}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const date = ctx.createMock<TemporalValue>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(date.instance).mustHappen(1);
                date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberBoostingLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userboostdate', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(null).mustHappen(1);
                    },
                    error: new BBTagRuntimeError('User not boosting')
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberBoostingLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userboostdate', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '`User not boosting`',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(null).mustHappen(1);
                    },
                    error: new BBTagRuntimeError('User not boosting')
                }
            ]
        })
    ]
});
