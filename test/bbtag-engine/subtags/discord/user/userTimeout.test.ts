import type { GuildMemberTimeoutLocals, TemporalValue } from '@blargbot/bbtag-engine';
import { BBTagRuntimeError, replacers } from '@blargbot/bbtag-engine';
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
                const date = ctx.createMock<TemporalValue>();
                ctx.locals.setup(m => m.userId).returns(userId).mustHappen(1);
                ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(date.instance).mustHappen(1);
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
                        const date = ctx.createMock<TemporalValue>();
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-01-01T00:00:00+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '2021-12-20T15:12:37+00:00',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('YYYY-MM-DDTHH:mm:ssZ')).returns('2021-12-20T15:12:37+00:00').mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(null).mustHappen(1);
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
                        const date = ctx.createMock<TemporalValue>();
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('01/01/2021').mustHappen(1);
                    }
                },
                {
                    expected: '20/12/2021',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(date.instance).mustHappen(1);
                        date.setup(m => m.format('DD/MM/YYYY')).returns('20/12/2021').mustHappen(1);
                    }
                },
                {
                    expected: '`User not timed out`',
                    error: new BBTagRuntimeError('User not timed out'),
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getGuildMemberTimeout(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
