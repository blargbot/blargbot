import type { GuildMemberBoostingLocals, TemporalValue } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.isUserBoostingReplacer,
    names: ['isUserBoosting'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<GuildMemberBoostingLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['isuserboosting', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.locals.setup(m => m.getGuildMemberBoostSince(userId)).resolves(date.instance).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getGuildMemberBoostSince(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
