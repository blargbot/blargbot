import type { IsDiscordStaffLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.isStaffReplacer,
    names: ['isStaff', 'isMod'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<IsDiscordStaffLocals>({
            quiet: '',
            generateCode(...args) {
                return `{${['isStaff', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: 'true',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.isStaff(userId)).returns(true).mustHappen(1);
                    }
                },
                {
                    expected: 'false',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.isStaff(userId)).returns(false).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
