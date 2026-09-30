import type { GuildMemberWarningLocals } from '@blargbot/bbtag-engine';
import { replacers } from '@blargbot/bbtag-engine';

import { runSubtagTests } from '../../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

await runSubtagTests({
    replacer: replacers.warningsReplacer,
    names: ['warnings'],
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases<GuildMemberWarningLocals>({
            quiet: undefined,
            generateCode(...args) {
                return `{${['warnings', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getGuildMemberWarnings(userId)).resolves(0).mustHappen(1);
                    }
                },
                {
                    expected: '1234',
                    setup(ctx, userId) {
                        ctx.locals.setup(m => m.getGuildMemberWarnings(userId)).resolves(1234).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
