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
                    title: 'user has no warnings',
                    expected: '0',
                    setup(ctx, userId) {
                        const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                        ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                        warnings.setup(m => m.get(userId)).resolves(0).mustHappen(1);
                    }
                },
                {
                    title: 'user has warnings',
                    expected: '1234',
                    setup(ctx, userId) {
                        const warnings = ctx.createMock<GuildMemberWarningLocals['warnings']>();
                        ctx.locals.setup(m => m.warnings).returns(warnings.instance).mustHappen(1);
                        warnings.setup(m => m.get(userId)).resolves(1234).mustHappen(1);
                    }
                }
            ]
        })
    ]
});
