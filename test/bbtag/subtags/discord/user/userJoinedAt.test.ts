import type { GuildMemberJoinedDateLocals, TemporalValue } from '@blargbot/bbtag-engine';
import { replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.userJoinedAtReplacer,
    names: ['userJoinedAt'],
    argCountBounds: { min: 0, max: 3 },
    cases: [
        {
            code: '{userjoinedat}',
            expected: '2021-01-01T00:00:00+00:00',
            setup(ctx) {
                const userId = random.bigint(10n ** 10n, 10n ** 20n);
                const date = ctx.createMock<TemporalValue>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.getJoinedTimestamp(userId)).resolves(date.instance).mustHappen(1);
                date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberJoinedDateLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userjoinedat', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.getJoinedTimestamp(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberJoinedDateLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['userjoinedat', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.getJoinedTimestamp(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('01/01/2021').mustHappen(1);
                    }
                }
            ]
        })
    ]
});
