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
                    title: 'the user is boosting',
                    expected: 'true',
                    setup(ctx, userId) {
                        const date = ctx.createMock<TemporalValue>();
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(date.instance).mustHappen(1);
                    }
                },
                {
                    title: 'the user is not boosting',
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.discord.setup(m => m.getBoostTimestamp(userId)).resolves(null).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
