import { Subtag } from '@bbtag/blargbot';
import { WarningsSubtag } from '@bbtag/blargbot/subtags';

import { runSubtagTests } from '../SubtagTestSuite.js';
import { createGetUserPropTestCases } from './_getUserPropTest.js';

runSubtagTests({
    subtag: Subtag.getDescriptor(WarningsSubtag),
    argCountBounds: { min: 0, max: 2 },
    cases: [
        ...createGetUserPropTestCases({
            quiet: undefined,
            generateCode(...args) {
                return `{${['warnings', ...args].join(';')}}`;
            },
            cases: [
                {
                    expected: '0',
                    postSetup(member, bbctx, ctx) {
                        ctx.dependencies.warnings.setup(m => m.count(bbctx, member)).thenResolve(0);
                    }
                },
                {
                    expected: '1234',
                    postSetup(member, bbctx, ctx) {
                        ctx.dependencies.warnings.setup(m => m.count(bbctx, member)).thenResolve(1234);
                    }
                }
            ]
        })
    ]
});
