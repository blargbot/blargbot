import type { GuildMemberTimeoutLocals, TemporalValue } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers, UserNotFoundError } from '@blargbot/bbtag-engine';
import { random } from '@blargbot/util';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

type Timeout = GuildMemberTimeoutLocals['discord']['userTimeout'];

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
                const timeout = ctx.createMock<Timeout>();
                const date = ctx.createMock<TemporalValue>();
                ctx.discord.setup((m, $) => m.queryUser('', $({ noLookup: false, throw: UserNotFoundError }))).returns(userId).mustHappen(1);
                ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                timeout.setup(m => m.get(userId)).resolves(date.instance).mustHappen(1);
                date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
            }
        },
        ...createGetUserPropTestCases<GuildMemberTimeoutLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimeout', '', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '2021-01-01T00:00:00+00:00',
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-12-20T15:12:37+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        }),
        ...createGetUserPropTestCases<GuildMemberTimeoutLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['usertimeout', 'DD/MM/YYYY', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '01/01/2021',
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('01/01/2021').mustHappen(1);
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('20/12/2021').mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        const timeout = ctx.createMock<Timeout>();
                        ctx.discord.setup(m => m.userTimeout).returns(timeout.instance).mustHappen(1);
                        timeout.setup(m => m.get(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
